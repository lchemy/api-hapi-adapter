import { Controller, Route } from "@lchemy/api";
import { Server } from "hapi";

import { apiRouteToHapiRoute } from "./api-route-to-hapi-route";

export function registerControllers(server: Server, controllers: Controller[]): void {
	controllers.reduce((memo, controller) => {
		return memo.concat(controller.getRoutes());
	}, [] as Route[]).map(apiRouteToHapiRoute).forEach((route) => {
		server.route(route);
	});
}
