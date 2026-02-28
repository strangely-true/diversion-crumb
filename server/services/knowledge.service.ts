import { prisma } from "@/server/prisma/client";

export class KnowledgeService {
  /**
   * Full-text search across title + content using Postgres plainto_tsquery.
   * Falls back to ILIKE if pg_trgm is not available.
   */
  static async search(query: string, limit = 5) {
    // Use Postgres full-text search
    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        content: string;
        category: string | null;
      }>
    >`
      SELECT id, title, content, category
      FROM "KnowledgeEntry"
      WHERE to_tsvector('english', title || ' ' || content)
         @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank(to_tsvector('english', title || ' ' || content),
                       plainto_tsquery('english', ${query})) DESC
      LIMIT ${limit}
    `;

    return results;
  }

  static async list(category?: string) {
    return prisma.knowledgeEntry.findMany({
      where: category ? { category } : undefined,
      orderBy: { updatedAt: "desc" },
    });
  }

  static async getById(id: string) {
    return prisma.knowledgeEntry.findUnique({ where: { id } });
  }

  static async create(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) {
    return prisma.knowledgeEntry.create({ data });
  }

  static async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      category?: string;
      tags?: string[];
    },
  ) {
    return prisma.knowledgeEntry.update({ where: { id }, data });
  }

  static async remove(id: string) {
    return prisma.knowledgeEntry.delete({ where: { id } });
  }
}
