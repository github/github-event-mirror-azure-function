import * as fs from 'fs';
import * as yaml from 'yaml';
import { EmitterWebhookEvent } from '@octokit/webhooks';

// read in filter config, from a YAML file called "filter.yml" in the root of the repo
// if the file doesn't exist, or is invalid YAML, we handle that gracefully
let filter_config: any;

try {
    filter_config = yaml.parse(fs.readFileSync('filter.yml', 'utf8'));
} catch (error) {
    // if the file doesn't exist, or can't be parsed, that's fine, we'll just use the default filter, which is to let everything through
    // we do log the error
    console.log(error);
}

export const eventFilter = (event: EmitterWebhookEvent): boolean => {
    if (filter_config === undefined) return true;

    const event_name = event.name;

    // check if the event type is allowed by the filter config
    // if there is an include list, and this type isn't on it, return false
    // if there is a matching entry in the excludes, and there are no more details under that entry, return false
    if (filter_config.include !== undefined && !(event_name in filter_config.include)
        || filter_config.exclude !== undefined && event_name in filter_config.exclude && Object.keys(filter_config.exclude).length === 0
    ) return false;

    // check the event payload against the filter config's include and exclude rules
    // we can include or exclude by any string-valued key in the payload, and we can match a single string, or an array of options
    const payload = event.payload as unknown as { [key: string]: unknown };

    const include_filter = filter_config.include[event_name];
    if (!applyFilter(payload, include_filter, true)) return false;

    const exclude_filter = filter_config.exclude[event_name];
    if (applyFilter(payload, exclude_filter, false)) return false;

    return true;
}

function applyFilter(payload: { [key: string]: unknown }, filter: { [key: string]: String | Array<String> }, sense: boolean): boolean {
    if (filter === undefined) return sense;

    const matches: boolean = Object.keys(filter).every(key => {
        const payload_value = payload[key] as string;

        if (typeof filter[key] === "string") {
            return payload_value === filter[key];
        } else if (Array.isArray(filter[key])) {
            return filter[key].includes(payload_value);
        }
        console.warn(`Filter is of unexpected type: ${typeof filter[key]}`);
        return false;
    });

    return matches;
}
