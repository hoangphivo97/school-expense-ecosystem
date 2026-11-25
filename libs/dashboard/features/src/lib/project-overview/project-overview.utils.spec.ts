import { parseChangelogMarkdown } from './project-overview.utils';

describe('parseChangelogMarkdown', () => {
  it('should return an empty array for empty or whitespace-only input', () => {
    expect(parseChangelogMarkdown('')).toEqual([]);
    expect(parseChangelogMarkdown('   \n  ')).toEqual([]);
  });

  it('should parse releases, sections, scopes, and commit links across * and - bullets', () => {
    const sampleMarkdown = `
    ## [1.2.0](https://github.com/hoangphivo97/school-expense-ecosystem/compare/v1.1.0...v1.2.0) (2026-11-25)

    ### Features

    * **auth:** implement realtime approval outcome stream ([a1b2c3d](https://github.com/hoangphivo97/school-expense-ecosystem/commit/a1b2c3d))
    - **overview:** add bilingual architectural showcase

    ### Bug Fixes

    * resolve stale JWT status transition ([9f8e7d6](https://github.com/hoangphivo97/school-expense-ecosystem/commit/9f8e7d6))
    `;

    const releases = parseChangelogMarkdown(sampleMarkdown);

    expect(releases).toHaveLength(1);
    expect(releases[0]).toMatchObject({
      version: '1.2.0',
      date: '2026-11-25',
      totalCommits: 3,
    });

    expect(releases[0].sections).toHaveLength(2);
    expect(releases[0].sections[0].items[0]).toEqual({
      scope: 'auth',
      description: 'implement realtime approval outcome stream',
      commitHash: 'a1b2c3d',
      commitUrl: 'https://github.com/hoangphivo97/school-expense-ecosystem/commit/a1b2c3d',
    });
    expect(releases[0].sections[0].items[1]).toEqual({
      scope: 'overview',
      description: 'add bilingual architectural showcase',
      commitHash: undefined,
      commitUrl: undefined,
    });
  });

  it('should safely ignore orphan sections or bullets outside a release header', () => {
    const malformed = `
### Features
* **orphan:** entry without release header
`;
    expect(parseChangelogMarkdown(malformed)).toEqual([]);
  });
});