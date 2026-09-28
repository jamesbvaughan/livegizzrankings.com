import type { Metadata } from "next";

import { Link } from "@/components/Link";
import { PageContent, PageTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
};

export default function NominatePage() {
  return (
    <>
      <PageTitle>About this site</PageTitle>

      <PageContent className="space-y-8">
        <div className="space-y-4">
          <p>
            The purpose of this site is to identify what the fan community
            believes to be King Gizzard &amp; The Lizard Wizard&apos;s best live
            performances of their songs.
          </p>

          <p>
            The rankings are determined by the{" "}
            <a
              href="https://en.wikipedia.org/wiki/Elo_rating_system"
              target="_blank"
              rel="noreferrer"
            >
              Elo rating system
            </a>
            , which calculates a score for each performance based on our votes.
          </p>

          <p>
            This site is open source. You can see and contribute to the code{" "}
            <Link href="https://github.com/jamesbvaughan/live-gizz-rankings">
              here on GitHub
            </Link>
            .
          </p>
        </div>

        <div className="space-y-4 text-lg">
          <h2 className="text-3xl">Related projects</h2>

          <div>
            <a
              className="font-bold"
              href="https://kglw.net/jams/artist/1"
              target="_blank"
              rel="noreferrer"
            >
              KGLW.net Notable Versions
            </a>{" "}
            <span className="text-muted">
              - A list of particularly notable live versions of songs, curated
              by the{" "}
              <a href="https://kglw.net" target="_blank" rel="noreferrer">
                KGLW.net
              </a>{" "}
              team.
            </span>
          </div>

          <div>
            <a
              className="font-bold"
              href="https://tapes.kglw.net/notables/curated/"
              target="_blank"
              rel="noreferrer"
            >
              Gizz Tapes Curated Notable Versions
            </a>{" "}
            <span className="text-muted">
              - A curated subset of the above list, only containing versions
              with recordings available to listen to on{" "}
              <a href="https://tapes.kglw.net/" target="blank" rel="noopener">
                Gizz Tapes
              </a>
              .
            </span>
          </div>

          <div>
            <span className="font-bold">
              The Best of Gizz &apos;24 (
              <a
                href="https://open.spotify.com/playlist/1NjPzQwuRoV6n8GAkCPrKZ"
                target="_blank"
                rel="noreferrer"
              >
                Spotify
              </a>
              ,{" "}
              <a
                href="https://music.youtube.com/playlist?list=PLqqsox9wp19vSEho7nBZEpNUY9XTReInM"
                target="_blank"
                rel="noreferrer"
              >
                YouTube
              </a>
              )
            </span>{" "}
            <span className="text-muted">
              - The best performances of the 2024 U.S. tour, as voted on by fans
              on{" "}
              <a
                href="https://www.reddit.com/r/KGATLW/"
                target="_blank"
                rel="noreferrer"
              >
                /r/KGATLW
              </a>
              , compiled by{" "}
              <a
                href="https://www.reddit.com/r/KGATLW/comments/1hppp77/best_of_gizz_24/"
                target="_blank"
                rel="noreferrer"
              >
                /u/Particular_Lie6809
              </a>
              .
            </span>
          </div>
        </div>
      </PageContent>
    </>
  );
}
