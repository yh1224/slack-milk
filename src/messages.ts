import * as fs from "fs";
import * as path from "path";
import {WebClient} from "@slack/web-api";
import {
    ConversationsHistoryResponse,
    ConversationsListResponse,
    ConversationsRepliesResponse
} from "@slack/web-api/dist/response";
import {fetchFile} from "./file";

/**
 * Fetch all reply messages.
 *
 * @param client
 * @param channelId
 * @param messageTs
 * @param outputDir
 */
const fetchReplyMessages = async (client: WebClient, channelId: string, messageTs: string, outputDir: string): Promise<number> => {
    let numMessages = 0;
    try {
        let cursor = undefined;
        while (true) {
            // https://api.slack.com/methods/conversations.history
            const res: ConversationsRepliesResponse = await client.conversations.replies({
                channel: channelId,
                ts: messageTs,
                cursor
            });
            cursor = res.response_metadata!.next_cursor;
            numMessages += res.messages?.length || 0;
            for (const message of res.messages || []) {
                const messagePath = path.join(outputDir, message.ts!);
                fs.mkdirSync(messagePath, {recursive: true});
                fs.writeFileSync(path.join(messagePath, "message.json"), JSON.stringify(message));
                process.stdout.write(".");

                // get all files on this message
                for (const file of message.files || []) {
                    if (file.url_private) {
                        const fileName = file.url_private.split("/").slice(-2).join("/");
                        const filePath = path.join(messagePath, "files", fileName);
                        await fetchFile(file.url_private, filePath, client.token);
                    }
                    process.stdout.write(".");
                }
            }
            if (!cursor) {
                break;
            }
        }
    } catch (e) {
        process.stderr.write(`${e}\n`);
    }
    return numMessages;
}

/**
 * Fetch all messages.
 *
 * @param client
 * @param channelId
 * @param outputDir
 */
const fetchMessages = async (client: WebClient, channelId: string, outputDir: string): Promise<number> => {
    let numMessages = 0;
    try {
        let cursor = undefined;
        while (true) {
            // https://api.slack.com/methods/conversations.history
            const res: ConversationsHistoryResponse = await client.conversations.history({channel: channelId, cursor});
            cursor = res.response_metadata!.next_cursor;
            for (const message of res.messages || []) {
                const messagePath = path.join(outputDir, "messages", message.ts!);

                // get all reply messages on this message
                const replies = await fetchReplyMessages(client, channelId, message.ts!, messagePath);
                process.stdout.write(`${replies}`);
                numMessages += replies
            }
            if (!cursor) {
                break;
            }
        }
        process.stdout.write(` (${numMessages} messages)\n`);
    } catch (e) {
        process.stderr.write(`${e}\n`);
    }
    return numMessages;
}

/**
 * Fetch all channels.
 *
 * required permissions:
 *  - channels:history
 *  - channels:read
 *  - files:read
 *  - groups:history
 *  - groups:read
 *
 * @param client
 * @param outputDir
 */
export const fetchChannels = async (client: WebClient, outputDir: string) => {
    try {
        let cursor = undefined;
        while (true) {
            // https://api.slack.com/methods/conversations.list
            const res: ConversationsListResponse = await client.conversations.list({
                types: "public_channel,private_channel",
                cursor,
            });
            cursor = res.response_metadata?.next_cursor;
            for (const channel of res.channels || []) {
                process.stdout.write(`channel: ${channel.id} (#${channel.name})\n`);
                const channelPath = path.join(outputDir, "channels", channel.id!);
                fs.mkdirSync(channelPath, {recursive: true});
                fs.writeFileSync(path.join(channelPath, "channel.json"), JSON.stringify(channel));

                // get all messages on this channel
                await fetchMessages(client, channel.id!, channelPath);
            }
            if (!cursor) {
                break;
            }
        }
    } catch (e) {
        process.stderr.write(`${e}\n`);
    }
}
