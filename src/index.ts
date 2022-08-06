#!/usr/bin/env node

import {ArgumentParser} from "argparse";
import {WebClient} from '@slack/web-api';
import {fetchChannels} from "./messages";
import {fetchUsers} from "./users";

process.on("uncaughtException", e => {
    process.stderr.write(`${e}\n`);
    process.exit(1);
});
process.on("unhandledRejection", e => {
    process.stderr.write(`${e}\n`);
    process.exit(1);
});

const {name, version} = require("../package.json");

(async () => {
    const parser = new ArgumentParser({"prog": name});
    parser.add_argument("-v", "--version", {action: "version", version});
    parser.add_argument("-o", "--output", {required: true, help: "output directory path"});
    const args = parser.parse_args();

    const token = process.env.SLACK_TOKEN;
    if (!token) {
        process.stderr.write(`${name}: error: environment variable SLACK_TOKEN required.\n`);
        process.exit(1);
    }

    const client = new WebClient(token);
    await fetchUsers(client, args.output);
    await fetchChannels(client, args.output);
})();
