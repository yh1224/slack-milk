import * as fs from "fs";
import * as path from "path";
import {WebClient} from '@slack/web-api';
import {UsersListResponse} from "@slack/web-api/dist/response";
import {fetchFile} from "./file";

/**
 * Fetch all users.
 *
 * required permissions:
 *  - users:read
 *
 * @param client
 * @param outputDir
 */
export const fetchUsers = async (client: WebClient, outputDir: string) => {
    let numUsers = 0;
    try {
        let cursor = undefined;
        while (true) {
            // https://api.slack.com/methods/users.list
            const res: UsersListResponse = await client.users.list({cursor});
            cursor = res.response_metadata?.next_cursor;
            numUsers += res.members?.length || 0;
            for (const user of res.members || []) {
                process.stdout.write(".");
                const userPath = path.join(outputDir, "users", user.id!);
                fs.mkdirSync(userPath, {recursive: true});
                fs.writeFileSync(path.join(userPath, "user.json"), JSON.stringify(user));

                // get original image for this user
                if (user.profile?.image_original) {
                    const fileName = user.profile?.image_original.split("/").slice(-2).join("/");
                    const filePath = path.join(userPath, "files", fileName);
                    await fetchFile(user.profile?.image_original, filePath);
                }
            }
            process.stdout.write(` (${numUsers} users)\n`);
            if (!cursor) {
                break;
            }
        }
    } catch (e) {
        process.stderr.write(`${e}\n`);
    }
}
