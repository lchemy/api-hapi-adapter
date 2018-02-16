import { Controller } from "@lchemy/api";
import { Plugin } from "hapi";

import { registerControllers } from "./register-controllers";

export interface PluginOptions {
	controllers: Controller[];
}

export const plugin: Plugin<PluginOptions> = {
	name: "lchemy-api",
	version: "1.0.0",
	multiple: true,
	register: async (server, options) => {
		registerControllers(server, options.controllers);
	}
};

export default plugin;
