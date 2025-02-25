const vscode = require('vscode');
const yaml = require('js-yaml');


/**
 * @param {vscode.ExtensionContext} context
 */
const letters = {
	a: "ᴀ",
	b: "ʙ",
	c: "ᴄ",
	ç: "ç",
	d: "ᴅ",
	e: "ᴇ",
	f: "ꜰ",
	g: "ɢ",
	ğ: "ğ",
	h: "ʜ",
	ı: "ı",
	i: "ɪ",
	j: "ᴊ",
	k: "ᴋ",
	l: "ʟ",
	m: "ᴍ",
	n: "ɴ",
	o: "ᴏ",
	ö: "ö",
	p: "ᴘ",
	r: "ʀ",
	s: "ѕ",
	ş: "ş",
	t: "ᴛ",
	u: "ᴜ",
	ü: "ü",
	v: "ᴠ",
	y: "ʏ",
	z: "ᴢ",
	w: "ᴡ",
	x: "х",
	q: "ǫ"
}
const placeholderRegex = /%[a-zA-Z0-9_]+%/g;
const colorCodeRegex = /&[0-9a-fk-or]/g;

function activate(context) {
	
	console.log('Congratulations, your extension "text2smalltext" is now active!');

	const convertSelected = vscode.commands.registerCommand('text2smalltext.convertSelected', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active text editor');
			return;
		}
		const document = editor.document;
		const selection = editor.selection;
		const text = document.getText(selection);
		const transformed = transformString(text);
		editor.edit(editBuilder => {
			editBuilder.replace(selection, transformed);
		});
	})
	const convertFull = vscode.commands.registerCommand('text2smalltext.convert', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active text editor');
			return;
		}
		const document = editor.document;
		const selection = editor.selection;
		const text = document.getText(selection);
		editor.edit(editBuilder => {
			if (document.languageId === 'json') {
				try {
					const parsed = JSON.parse(text);
					const transformed = transform(parsed);
					editBuilder.replace(selection, JSON.stringify(transformed, null, 2));
				} catch (error) {
					vscode.window.showErrorMessage("Invalid JSON.");
				}
			} else if (document.languageId === 'yaml' || document.languageId === 'yml') {
				try {
					const parsed = yaml.load(text);
					const transformed = transform(parsed);
					const newYaml = yaml.dump(transformed);
					editBuilder.replace(selection, newYaml);
				} catch (error) {
					vscode.window.showErrorMessage("Error converting YAML: " + error.message);
				}
			} else {
				// Plain string conversion
				editBuilder.replace(selection, text.split('').map(char =>
					letters.hasOwnProperty(char.toLowerCase()) ? letters[char.toLowerCase()] : char
				).join(''));
			}
		});
	});

	context.subscriptions.push(convertSelected, convertFull);
}

const transform = obj => {
	if (typeof obj === 'string') {
		return transformString(obj);
	} else if (Array.isArray(obj)) {
		return obj.map(item => transform(item));
	} else if (obj && typeof obj === 'object') {
		const newObj = {};
		for (const key in obj) {
			newObj[key] = transform(obj[key]);
		}
		return newObj;
	}
	return obj;
};
const transformString = str => {
	let result = '';
	let lastIndex = 0;
	// Create a combined regex from placeholderRegex and colorCodeRegex
	const combinedRegex = new RegExp(`${placeholderRegex.source}|${colorCodeRegex.source}`, 'g');
	let match;
	while ((match = combinedRegex.exec(str)) !== null) {
		// Transform text before the match
		result += str
			.substring(lastIndex, match.index)
			.split('')
			.map(char => letters.hasOwnProperty(char.toLowerCase()) ? letters[char.toLowerCase()] : char)
			.join('');
		
		// Append the matched placeholder or color code without transforming it
		result += match[0];
		lastIndex = combinedRegex.lastIndex;
	}
	// Transform the remaining part of the string
	result += str
		.substring(lastIndex)
		.split('')
		.map(char => letters.hasOwnProperty(char.toLowerCase()) ? letters[char.toLowerCase()] : char)
		.join('');
	return result;
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
