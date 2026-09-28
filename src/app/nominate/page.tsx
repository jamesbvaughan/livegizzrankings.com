import type { Metadata } from "next";

import { Link } from "@/components/Link";
import { PageContent, PageTitle } from "@/components/ui";

import { NominationForm } from "../NominationForm";
import { SongsWithoutPerformances } from "./SongsWithoutPerformances";

export const metadata: Metadata = {
  title: "Nominate a performance",
};

export default function NominatePage() {
  return (
    <>
      <PageTitle>Nominate a performance</PageTitle>

      <PageContent className="space-y-8">
        <div className="space-y-6">
          <p>
            Is this site missing one of your favorite performances? Use this
            form to nominate it for inclusion, or{" "}
            <Link href="/nominations">browse existing nominations</Link>.
          </p>

          <NominationForm />
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl">Nomination suggestions</h2>

            <p>
              You can nominate any performance you like, but here are some
              suggestions for songs that could use some help.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl">Songs with no nominated performances</h2>

              <p>
                These are songs that no one has nominated any performance for
                yet.
              </p>
            </div>

            <SongsWithoutPerformances performanceCount={0} />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl">
                Songs with just a single nominated performance
              </h2>

              <p>
                These are songs that only have one nominated performance so far.
              </p>
            </div>

            <SongsWithoutPerformances performanceCount={1} />
          </div>
        </div>
      </PageContent>
    </>
  );
}
