import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { DocumentModel, PendingNoteModel } from "../models/index.js";
import jwt from 'jsonwebtoken';
import { Redis } from "@hocuspocus/extension-redis";
import { config } from "../config/index.js";

export const hocuspocus = new Hocuspocus({
  name: "lumina-collab",

  async onListen({ port }) {
    console.log(`Hocuspocus WebSocket server listening on port ${port}`);
  },

  async onAuthenticate({ token }) {
    if (!token) {
      console.log("No token provided, allowing anonymous access");
      return { userId: null };
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { sub: string };
      console.log(`Authenticated user: ${decoded.sub}`);
      return { userId: decoded.sub };
    } catch (error) {
      console.log("Invalid token, allowing anonymous access");
      return { userId: null };
    }
  },
  async onLoadDocument({ documentName, document }) {
    return document;
  },
  extensions: [
    new Redis({
      host: config.redis.host,
      port: config.redis.port,
      options: config.redis.password
        ? { password: config.redis.password }
        : undefined,
      prefix: config.hocuspocus.prefix,
    }),
    new Database({
      fetch: async ({ documentName }) => {
        try {
          const doc = await DocumentModel.findOne({ name: documentName });
          if (doc?.data) {
            console.log(`Fetched document: ${documentName}`);
            return new Uint8Array(doc.data);
          }
          console.log(`New document: ${documentName}`);
          return null;
        } catch (error) {
          console.error(`Error fetching document ${documentName}:`, error);
          return null;
        }
      },
      store: async ({ documentName, state, context }) => {
        try {
          const userId = (context as any)?.userId || null;
          await DocumentModel.findOneAndUpdate(
            { name: documentName },
            {
              name: documentName,
              data: Buffer.from(state),
              ...(userId && { userId }),
            },
            { upsert: true, new: true },
          );
          console.log(
            `Saved document: ${documentName} (user: ${userId || "anonymous"})`,
          );
        } catch (error) {
          console.error(`Error saving document ${documentName}:`, error);
        }
      },
    }),
  ],
});
