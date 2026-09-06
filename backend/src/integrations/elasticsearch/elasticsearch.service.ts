import { Client } from "@elastic/elasticsearch";

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://127.0.0.1:9200",
});

const EMAIL_INDEX = "emails";

export interface EmailSearchDocument {
  id: string;
  userId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: string;
  senderEmail: string;
  senderDisplayName: string | null;
  errorMessage: string | null;
}

export async function initializeEmailIndex() {
  const exists = await client.indices.exists({
    index: EMAIL_INDEX,
  });

  if (!exists) {
    await client.indices.create({
      index: EMAIL_INDEX,
      mappings: {
        properties: {
          id: { type: "keyword" },
          userId: { type: "keyword" },
          recipient: { type: "text" },
          subject: { type: "text" },
          body: { type: "text" },
          scheduledAt: { type: "date" },
          sentAt: { type: "date" },
          status: { type: "keyword" },
          senderEmail: { type: "text" },
          senderDisplayName: { type: "text" },
          errorMessage: { type: "text" },
        },
      },
    });

    console.log("Elasticsearch emails index created");
  }
}

export async function indexEmail(
  email: EmailSearchDocument
) {
  await client.index({
    index: EMAIL_INDEX,
    id: email.id,
    document: email,
    refresh: "wait_for",
  });
}

export async function searchEmails(
  userId: string,
  query: string
) {
  const result = await client.search<EmailSearchDocument>({
    index: EMAIL_INDEX,
    query: {
      bool: {
        must: [
          {
            term: {
              userId,
            },
          },
          {
            multi_match: {
              query,
              fields: [
                "recipient",
                "subject",
                "body",
                "senderEmail",
                "senderDisplayName",
              ],
            },
          },
        ],
      },
    },
    sort: [
      {
        scheduledAt: {
          order: "desc",
        },
      },
    ],
  });

  return result.hits.hits
    .filter((hit) => hit._source)
    .map((hit) => hit._source as EmailSearchDocument);
}

export async function updateIndexedEmail(
  email: EmailSearchDocument
) {
  await client.index({
    index: EMAIL_INDEX,
    id: email.id,
    document: email,
    refresh: "wait_for",
  });
}

export { client };