# Dependencies of `@specstride/config`

The package carries exactly one runtime dependency. D-8 (owner 110): "a
dependency of the package that loads configuration (owner 110) and of no other
package".

| Package | Version | Licence | Recorded by                                                                                                                                                         |
| ------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yaml`  | 2.9.1   | ISC     | `specs/110-config-and-terms/research.md` (decision 7, §T044, row "Licence and version of the YAML parser"), `packages/config/src/load/files.ts` (`YAML_PARSER_PIN`) |

The pin is one exact release and not a range (F100-FR-027): `packages/config/package.json`
declares `yaml` at `2.9.1`, and the loader's constant carries the same version
and the same licence, so the parser cannot change under the product. The parser
is used in the mode that constructs no code: the YAML 1.2 core schema, with no
custom tag and no merge key (`YAML_PARSE_OPTIONS`, T044).
