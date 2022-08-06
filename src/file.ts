import axios, {AxiosRequestConfig} from "axios";
import * as fs from "fs";
import * as path from "path";

/**
 * Fetch file.
 *
 * @param token
 * @param url
 * @param outputPath
 */
export const fetchFile = async (url: string, outputPath: string, token?: string): Promise<void> => {
    try {
        let config: AxiosRequestConfig = {responseType: "stream"};
        if (token) {
            config = Object.assign({headers: {"Authorization": `Bearer ${token}`}}, config);
        }
        const res = await axios.get(url, config);
        fs.mkdirSync(path.dirname(outputPath), {recursive: true});
        const writer = fs.createWriteStream(outputPath);
        res.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        })
    } catch (e) {
        process.stderr.write(`${url}: ${e}\n`);
    }
}
