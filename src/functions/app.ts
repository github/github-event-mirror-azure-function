import { Probot } from "probot";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { GitHubAppWebHookPayload } from "./types";
import { eventFilter } from "./filter";

const setupApp = (app: Probot) => {
  app.onAny(async (event: EmitterWebhookEvent) => {
    const payload = event.payload as GitHubAppWebHookPayload;

    const octokit = await app.auth(payload.installation.id);

    if (eventFilter(event)) {
      await octokit.repos.createDispatchEvent({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        event_type: event.name,
        client_payload: payload as unknown as { [key: string]: unknown },
      });
    }
  });
};

export default setupApp;
