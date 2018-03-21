import { ApiRequest, Controller, route } from "@lchemy/api";
import Boom from "boom";
import { Server } from "hapi";
import "reflect-metadata";

import { plugin } from "./plugin";

describe("plugin", () => {
	class EchoController extends Controller {
		@route("GET", "/echo", "optional")
		getEcho(request: ApiRequest): object {
			return request;
		}

		@route("POST", "/echo", "optional")
		postEcho(request: ApiRequest): object {
			return request;
		}

		@route("PUT", "/echo/{a}/{b*2}/{c?}", "optional")
		param(request: ApiRequest): object {
			return request;
		}
	}

	class MetadataController extends Controller {
		@route("GET", "/metadata/description", "optional", {
			description: "test description"
		})
		description(_: ApiRequest): object {
			return this.getRoutes().find((r) => r.path === "/metadata/description")!.metadata!;
		}

		@route("GET", "/metadata/content-type", "optional", {
			contentType: "text/plain"
		})
		contentType(_: ApiRequest): string {
			return "hello";
		}
	}

	class ErrorController extends Controller {
		@route("GET", "/error/boom", "optional")
		boom(_: ApiRequest): object {
			throw Boom.badRequest();
		}

		@route("GET", "/error/internal", "optional")
		internal(_: ApiRequest): object {
			throw Error();
		}
	}

	class AuthController extends Controller {
		@route("GET", "/auth/required", "required")
		required(_: ApiRequest): object {
			return {
				success: true
			};
		}

		@route("GET", "/auth/optional", "optional")
		optional(_: ApiRequest): object {
			return {
				success: true
			};
		}

		@route("GET", "/auth/none", "none")
		none(_: ApiRequest): object {
			return {
				success: true
			};
		}

		@route("GET", "/auth/test", (auth) => auth === "test")
		test(_: ApiRequest): object {
			return {
				success: true
			};
		}

		@route("GET", "/auth/test2", () => true, {
			authStrategies: ["test2"]
		})
		test2({ auth }: ApiRequest): object {
			return { auth };
		}
	}

	const controllers = [
		EchoController,
		MetadataController,
		ErrorController,
		AuthController
	];

	let server: Server,
		credentials: any;

	beforeAll(async () => {
		server = new Server({
			debug: false
		});

		server.auth.scheme("test", () => {
			return {
				authenticate: (_, h) => {
					if (credentials == null) {
						return Boom.unauthorized();
					} else {
						return h.authenticated({ credentials });
					}
				}
			};
		});
		server.auth.scheme("test2", () => {
			return {
				authenticate: (_, h) => {
					if (credentials == null) {
						return Boom.unauthorized();
					} else {
						return h.authenticated({
							credentials: {
								...credentials,
								hello: "world"
							}
						});
					}
				}
			};
		});
		server.auth.strategy("test", "test");
		server.auth.strategy("test2", "test2");
		server.auth.default({
			mode: "required",
			strategy: "test"
		});

		await server.register({
			plugin,
			options: {
				controllers: controllers.map((ctor) => new ctor())
			}
		});
	});

	beforeEach(() => {
		credentials = {};
	});

	it("should echo simple requests", async () => {
		const res0 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/echo"
		});
		expect(JSON.parse(res0.payload)).toEqual({
			params: {},
			query: {},
			body: null,
			auth: credentials
		});

		const res1 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/echo?a=1&b=2"
		});
		expect(JSON.parse(res1.payload)).toEqual({
			params: {},
			query: {
				a: "1",
				b: "2"
			},
			body: null,
			auth: credentials
		});

		const res2 = await server.inject({
			app: {},
			method: "POST",
			url: "http://localhost/echo",
			payload: {
				test: "ing"
			}
		});
		expect(JSON.parse(res2.payload)).toEqual({
			params: {},
			query: {},
			body: {
				test: "ing"
			},
			auth: credentials
		});

		const res3 = await server.inject({
			app: {},
			method: "PUT",
			url: "http://localhost/echo/1/2/3"
		});
		expect(JSON.parse(res3.payload)).toEqual({
			params: {
				a: "1",
				b: "2/3"
			},
			query: {},
			body: null,
			auth: credentials
		});
	});

	it("should have the proper metadata set", async () => {
		const res0 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/metadata/description"
		});
		expect(JSON.parse(res0.payload)).toEqual({
			description: "test description"
		});

		const res1 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/metadata/content-type"
		});
		expect(res1.payload).toBe("hello");
		expect(res1.headers["content-type"]).toContain("text/plain");
	});

	it("should catch errors and handle boom errors correctly", async () => {
		const res0 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/error/boom"
		});
		expect(JSON.parse(res0.payload)).toEqual({
			statusCode: 400,
			error: "Bad Request",
			message: "Bad Request"
		});
		expect(res0.statusCode).toBe(400);

		const res1 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/error/internal"
		});
		expect(JSON.parse(res1.payload)).toEqual({
			statusCode: 500,
			error: "Internal Server Error",
			message: "An internal server error occurred"
		});
		expect(res1.statusCode).toBe(500);
	});

	it("should handle auth properly", async () => {
		credentials = null;
		const res0 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/required"
		});
		expect(JSON.parse(res0.payload)).toEqual({
			statusCode: 401,
			error: "Unauthorized",
			message: "Unauthorized"
		});
		expect(res0.statusCode).toBe(401);

		credentials = {};
		const res1 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/required"
		});
		expect(JSON.parse(res1.payload)).toEqual({
			success: true
		});

		credentials = null;
		const res2 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/optional"
		});
		expect(JSON.parse(res2.payload)).toEqual({
			success: true
		});

		credentials = {};
		const res3 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/optional"
		});
		expect(JSON.parse(res3.payload)).toEqual({
			success: true
		});

		credentials = null;
		const res4 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/test"
		});
		expect(JSON.parse(res4.payload)).toEqual({
			statusCode: 401,
			error: "Unauthorized",
			message: "Unauthorized"
		});
		expect(res4.statusCode).toBe(401);

		credentials = {};
		const res5 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/test"
		});
		expect(JSON.parse(res5.payload)).toEqual({
			statusCode: 403,
			error: "Forbidden",
			message: "Forbidden"
		});
		expect(res5.statusCode).toBe(403);

		credentials = "test";
		const res6 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/test"
		});
		expect(JSON.parse(res6.payload)).toEqual({
			success: true
		});

		credentials = null;
		const res7 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/none"
		});
		expect(JSON.parse(res7.payload)).toEqual({
			success: true
		});

		credentials = { test: 2 };
		const res8 = await server.inject({
			app: {},
			method: "GET",
			url: "http://localhost/auth/test2"
		});
		expect(JSON.parse(res8.payload)).toEqual({
			auth: {
				test: 2,
				hello: "world"
			}
		});
	});
});
