/**
 * T067 of `specs/112-doctor` and T044 follow-up — the INPUT this plugin
 * supplies to the owner claims of EP-14: the marker of this package, and the
 * ids of the doctor checks this host registers — the rows of group `host` of
 * the doctor's catalogue (`packages/doctor/data/check-catalogue.tsv`,
 * CT-112-112 of the doctor's own suite holds them).
 *
 * The claims themselves are the testkit's frame
 * (`registerOwnerPlaceClaims` and `registerSampleCheckBoundaryClaims` of
 * `@specstride/testkit/conformance/EP-14/owner-claims`); the file that runs
 * them is `ep14-owner-rows.test.ts` beside this one. This file holds only
 * what is this host's to supply.
 */
import type { HostOwnerRows } from "@specstride/testkit/conformance/EP-14/owner-rows";

/** This plugin's rows: its package marker, and the doctor checks it registers. */
export const HOST_OWNER_ROWS: HostOwnerRows = Object.freeze({
  packageMarker: "host-claude-code",
  doctorCheckIds: Object.freeze([
    "host.plugin",
    "host.claudeFloor",
    "host.managedSettings",
    "host.bgIsolation",
  ]),
});
