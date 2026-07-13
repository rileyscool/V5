import { Chat } from './Chat';
import { File, Links, globalAssetsDir } from './Constants';
import { downloadFile } from './FileUtils';

export const fetchURL = (url, headers = {}) => {
    try {
        let conn = new java.net.URL(url).openConnection();
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        Object.keys(headers).forEach((key) => {
            const value = headers[key];
            if (value !== undefined && value !== null) {
                conn.setRequestProperty(String(key), String(value));
            }
        });
        let reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
        let inputLine;
        let response = '';
        while ((inputLine = reader.readLine()) != null) {
            response += inputLine + '\n';
        }
        reader.close();
        return response;
    } catch (e) {
        console.error('V5 Caught error' + e + e.stack);
        return null;
    }
};

const profilePath = new File(globalAssetsDir, 'discordProfile.png');
let discordPfpPath = null;

export const getDiscordPfpPath = () => discordPfpPath;

export const returnDiscord = (authToken) => {
    try {
        if (!profilePath.exists()) {
            const t = new java.lang.Thread(() => {
                if (!profilePath.getParentFile().exists()) profilePath.getParentFile().mkdirs();

                const responseText = fetchURL(`${Links.BASE_API_URL}/api/me`, {
                    Authorization: `Bearer ${authToken}`,
                });

                if (!responseText || responseText.trim() === '') {
                    Chat.message('Failed to get a valid response for Discord PFP.');
                    return;
                }

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    Chat.message('Failed to parse Discord PFP data. Check console for error.');
                    Chat.log('Invalid JSON received: ' + responseText);
                    console.error('V5 Caught error' + e + e.stack);
                    return;
                }

                if (!data || !data.discord || !data.discord.avatar) {
                    Chat.message('Failed to download your Discord pfp: Invalid data format.');
                    return;
                }

                downloadFile(data.discord.avatar, profilePath.getAbsolutePath(), {
                    onError: (e) => {
                        Chat.message('Download failed: ' + e);
                        console.error('V5 Caught error' + e + e.stack);
                    },
                });
                discordPfpPath = profilePath.getAbsolutePath();
            });
            t.setDaemon(true);
            t.start();
        } else {
            discordPfpPath = profilePath.getAbsolutePath();
        }
    } catch (e) {
        Chat.message('An unexpected error occurred while fetching Discord PFP: ' + e);
        console.error('V5 Caught error' + e + e.stack);
    }
};
