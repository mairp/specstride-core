# Feature Specification: Greeting

**Feature Branch**: `reverse-app`

**Created**: 2026-01-01

**Status**: Draft

## User Scenarios & Testing

### User Story 1 - A reader runs the greeting (Priority: P1)

A reader of the source runs it and reads one line.

**Why this priority**: it is the whole of the behaviour.

**Independent Test**: run the module and read the line.

**Acceptance Scenarios**:

1. **Given** the module on the path, **When** it is run, **Then** it prints one greeting.

## Requirements

- **FR-001**: The source prints the greeting of one name.
<!-- evidence: app.py:1-3 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-002**: The source prints the greeting of `world` when it is run as a module.
<!-- evidence: app.py:6-7 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

## Success Criteria

- **SC-1**: One line reaches standard output.
<!-- evidence: app.py:6-7 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

## Assumptions

The reader has python3.
