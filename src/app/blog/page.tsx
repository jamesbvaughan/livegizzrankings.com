import { Link } from "@/components/Link";
import { PageContent, PageTitle } from "@/components/ui";

import { getBlogPosts } from "./utils";

function BlogPosts() {
  const allBlogs = getBlogPosts();

  return (
    <div>
      {allBlogs
        .filter((post) => post.metadata.draft !== "true")
        .toSorted(
          (a, b) =>
            new Date(b.metadata.publishedAt).getTime() -
            new Date(a.metadata.publishedAt).getTime(),
        )
        .map((post) => (
          <Link
            key={post.slug}
            className="flex text-lg no-underline"
            href={`/blog/${post.slug}`}
          >
            <p className="text-muted w-[120px] tabular-nums">
              {post.metadata.publishedAt}
            </p>

            <p>{post.metadata.title}</p>
          </Link>
        ))}
    </div>
  );
}

export default function BlogPage() {
  return (
    <>
      <PageTitle>Blog</PageTitle>

      <PageContent>
        <BlogPosts />
      </PageContent>
    </>
  );
}
