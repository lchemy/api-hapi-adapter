import { RouteConfiguration } from "@lchemy/api";
import Boom from "boom";
import { Request, ResponseToolkit, RouteOptions, ServerRoute } from "hapi";

export function apiRouteToHapiRoute(route: RouteConfiguration): ServerRoute {
	const config: RouteOptions = {
		auth: {
			mode: "try"
		},
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
				const query = request.query,
					params = request.params,
					body = request.payload,
					auth = request.auth.credentials;

				const result = await route.handler({
					query,
					params,
					body,
					auth
				});

				const response = h.response(result);
				if (contentType != null) {
					response.type(contentType);
				}
				return response;
			} catch (err) {
				if (!Boom.isBoom(err)) {
					err = Boom.badImplementation(undefined, err);
				}
				return err;
			}
		},
		config
	};
}
