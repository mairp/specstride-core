/**
 * T067 (feature 112) — CT-112-133, the place of a registered check
 * (F112-FR-033). The repairs after the cross-feature review (2026-09-30).
 *
 * The claims run from the frame of the testkit
 * (`registerOwnerPlaceClaims` of `./owner-claims.ts`), over the doctor tree
 * of this repository. The rows of the host are input (`./owner-rows.ts`);
 * this file registers the claims over the kit's SAMPLE host — no host of this
 * repository is named here. A host package registers the same claims with its
 * own rows, from its own test tree.
 *
 * The three claims of the frame:
 *
 *  1. `packages/doctor/` holds no file of a check that another feature
 *     registers — scanned over the sources and the data of the whole doctor
 *     package, against the ids of the two stubs of the test tree, the known
 *     owner checks of the other core features, and the rows of the host;
 *  2. the doctor imports no package of an owner, and a check registered
 *     through the registration call of the kernel package
 *     (`registerDoctorCheck`) needs no import of the doctor — the fixture
 *     `owner-stubs.ts` imports `@specstride/contracts` and
 *     `@specstride/kernel` and never the doctor, and the doctor's manifest
 *     and imports name no owner package;
 *  3. a check registered from outside — here the two stubs, one finding for
 *     a customisation that cannot be switched off and one for a missing
 *     terminal tool — is rendered in text and in `--json` by the rules of a
 *     core check: order by severity then id, the message from the template,
 *     the fix as remedy, `ok` never printed, the caps of the text renderer,
 *     and the schema `specstride.doctor/1` in JSON.
 */
import { registerOwnerPlaceClaims } from "./owner-claims.ts";
import { SAMPLE_HOST_OWNER_ROWS } from "./owner-rows.ts";

registerOwnerPlaceClaims({ host: SAMPLE_HOST_OWNER_ROWS });
