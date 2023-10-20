type Config = {
    ROOM_WIDTH: number,
    ROOM_HEIGHT: number,
    PORT: number,
    BOTS: number,
    MESSAGE_LIMIT: number,
    CHAT_LIMIT: number,
    CHAT_INTERVAL: number,
};

declare const config: Config;

export default config;