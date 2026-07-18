import {describe, expect, it} from 'vitest';
import {
  COUNTRY_NAME_ALIASES,
  COUNTRY_OPTIONS,
  LEGACY_COUNTRY_OPTIONS
} from '../constants';
import {
  canonicalCountryName,
  nameToCountryOption,
  nameToFlagCode,
  nameToMemberOption,
  searchCountryOptions
} from './member';

describe('country options', () => {
  it('contains every current ISO 3166 entry plus the European Union', () => {
    expect(COUNTRY_OPTIONS).toHaveLength(250);
    expect(new Set(COUNTRY_OPTIONS.map(option => option.key)).size).toBe(250);
    expect(new Set(COUNTRY_OPTIONS.map(option => option.text)).size).toBe(250);
  });

  it.each([
    ['Lesotho', 'ls'],
    ['Myanmar', 'mm'],
    ['Tokelau', 'tk'],
    ['Tuvalu', 'tv'],
    ['Syrian Arab Republic', 'sy'],
    ['South Sudan', 'ss'],
  ])('provides the current option and flag for %s', (name, code) => {
    expect(nameToCountryOption(name)).toMatchObject({
      key: code,
      value: code,
      flag: code,
      text: name,
    });
    expect(nameToFlagCode(name)).toBe(code);
  });

  it.each(['aq', 'bl', 'bq', 'cw', 'gg', 'im', 'je', 'mf', 'sx'])(
    'includes the previously omitted ISO code %s',
    code => {
      expect(COUNTRY_OPTIONS.some(option => option.key === code)).toBe(true);
    }
  );
});

describe('stored country name compatibility', () => {
  it.each(Object.entries(COUNTRY_NAME_ALIASES))(
    'resolves the legacy name %s',
    (legacyName, code) => {
      const option = nameToCountryOption(legacyName);
      expect(option?.value).toBe(code);
      expect(nameToFlagCode(legacyName)).toBe(code);
      expect(canonicalCountryName(legacyName)).toBe(option?.text);
    }
  );

  it('keeps deleted codes readable without offering them for new members', () => {
    const legacyOption = LEGACY_COUNTRY_OPTIONS[0];

    expect(COUNTRY_OPTIONS).not.toContainEqual(legacyOption);
    expect(nameToMemberOption('Netherlands Antilles')).toEqual(legacyOption);
    expect(nameToFlagCode('Netherlands Antilles')).toBe('an');
  });

  it('uses the current Serbian code for name-only database rows', () => {
    expect(nameToMemberOption('Serbia').value).toBe('rs');
  });

  it('finds canonical options by legacy names and unaccented text', () => {
    expect(searchCountryOptions(COUNTRY_OPTIONS, 'Turkey')).toEqual([
      nameToMemberOption('Türkiye'),
    ]);
    expect(searchCountryOptions(COUNTRY_OPTIONS, 'Turkiye')).toEqual([
      nameToMemberOption('Türkiye'),
    ]);
    expect(searchCountryOptions(COUNTRY_OPTIONS, 'Cote dIvoire')).toEqual([
      nameToMemberOption("Côte d'Ivoire"),
    ]);
  });
});
