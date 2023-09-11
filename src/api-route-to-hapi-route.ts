import { ApiResponse, Route } from "@lchemy/api";
import Boom from "boom";
import { Request, RequestQuery, ResponseObject, ResponseToolkit, RouteOptions, ServerRoute } from "hapi";

export function apiRouteToHapiRoute(route: Route): ServerRoute {
	const options: RouteOptions = {
		auth: (route.auth !== "none" ? {
			mode: "try",
			strategies: route.metadata != null ? route.metadata.authStrategies : undefined
		} : false),
		description: route.metadata != null ? route.metadata!.description : undefined
	};

	let contentType: string | undefined;
	if (route.metadata != null && route.metadata.contentType != null) {
		contentType = route.metadata.contentType;
	}

	return {
		method: route.method,
		path: route.path,
		handler: async (request: Request, h: ResponseToolkit) => {
			try {
				const query = request.query as RequestQuery,
					params = request.params,
					headers = request.headers,
					body = request.payload,
					auth = request.auth.credentials;

				const result = await route.handler({
					query,
					params,
					headers,
					body,
					auth
				});

				let response: ResponseObject;
				if (result instanceof ApiResponse) {
					response = h.response(result.value);
					response.code(result.statusCode);
					if (result.contentType != null) {
						response.type(result.contentType);
					} else if (contentType != null) {
						response.type(contentType);
					}
					Object.keys(result.headers).forEach((key) => {
						response.header(key, result.headers[key]);
					});
				} else {
					response = h.response(result);
					if (contentType != null) {
						response.type(contentType);
					}
				}

				return response;
			} catch (err: any) {
				if (!Boom.isBoom(err)) {
					err = Boom.badImplementation(undefined, err);
				}
				return err;
			}
		},
		options
	};
}
