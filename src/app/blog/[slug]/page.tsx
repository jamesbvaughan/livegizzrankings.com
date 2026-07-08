import { evaluate } from "@mdx-js/mdx";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as runtime from "react/jsx-runtime";

import {
  PageContent,
  PageSubtitle,
  PageTitle,
  PageType,
} from "@/components/ui";

import { getBlogPosts } from "../utils";

export function generateStaticParams() {
  const posts = getBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

interface Params {
  slug: string;
}

interface Props {
  params: Promise<Params>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPosts().find((p) => p.slug === slug);
  if (!post) {
    notFound();
  }

  const { title, publishedAt: publishedTime, description } = post.metadata;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPosts().find((p) => p.slug === slug);
  if (!post) {
    notFound();
  }

  const { default: MDXContent } = await evaluate(post.content, runtime);

  const date = new Date(post.metadata.publishedAt);
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);

  return (
    <>
      <PageType>
        <Link href="/blog" className="no-underline">
          Blog
        </Link>
      </PageType>

      <PageTitle>{post.metadata.title}</PageTitle>

      <PageSubtitle>{formattedDate}</PageSubtitle>

      <PageContent className="prose prose-xl prose-stone prose-invert leading-6">
        <MDXContent />
      </PageContent>
    </>
  );
}
