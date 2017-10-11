'use strict';
const [, , dirPath = '.', defaultLang = 'en'] = process.argv;

const path = require('path')
    , fs = require('fs')
    , _ = require('lodash');

function flattenKeys(translations, prefix = '') {
    return _.transform(
        translations,
        (flatKeys, value, key) => {
            const prefixedKey = `${prefix}${key}`;
            if (_.isPlainObject(value)) {
                flatKeys.push(...flattenKeys(value, `${prefixedKey}.`));
            } else {
                flatKeys.push(prefixedKey);
            }
        },
        []
    );
}

function loadTranslations() {
    const dir = path.resolve(dirPath)
        , files = fs.readdirSync(dir);

    let defaultTranslations = {},
        defaultTranslationKeys = [];

    const translationKeysByLang = {};

    files.filter(filename => filename.match(/.json$/))
         .forEach((filename) => {
             const translationsFile = require(path.resolve(dirPath, filename));
             const t10Keys = flattenKeys(translationsFile);

             if (filename.startsWith(defaultLang)) {
                 defaultTranslations = translationsFile;
                 defaultTranslationKeys = t10Keys;
             } else {
                 translationKeysByLang[filename] = t10Keys;
             }
         });

    return {translationKeysByLang, defaultTranslations, defaultTranslationKeys};
}

function findMissing({translationKeysByLang, defaultTranslations, defaultTranslationKeys}) {
    _.forIn(
        translationKeysByLang,
        (t10nKeys, language) => {
            const missingKeys = _.difference(defaultTranslationKeys, t10nKeys);

            if (missingKeys.length) {
                console.warn(`${language} is missing:\n`);

                console.warn(
                    missingKeys.map(
                        missingKey => `\t"${missingKey}"\t (default value: "${_.get(defaultTranslations, missingKey)}")`
                    ).join('\n')
                );

            } else {
                console.log(`${language} has same keys as default (${defaultLang})`);
            }
        }
    );
}

findMissing(loadTranslations());
