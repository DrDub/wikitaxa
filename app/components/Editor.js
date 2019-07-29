const React = require('react');
const stringifyObject = require('stringify-object');
const RCE = React.createElement;

const WikiSection = require('./WikiSection');

module.exports = class Editor extends React.Component {
	static displayName = 'Editor';

	constructor(props) {
		super(props);
		const { data, query } = props;

		const json = data && data[0] ? stringifyObject(data[0], { indent: '  ' }) : '';

		const dataEntries = Editor.parseData(data[1]);
		const wikiEntries = Editor.parseData(data[2]);
		const speciesEntries = Editor.parseData(data[3]);

		const allEntries = dataEntries.concat(wikiEntries).concat(speciesEntries);
		const noResults = !allEntries.length;
		const url = noResults ? '' : allEntries[0].url;

		this.state = {
			json,
			query,
			dataEntries,
			wikiEntries,
			speciesEntries,
			noResults,
			url
		};
	}

	static parseData = entries => (Array.isArray(entries) ? entries : [entries]).filter(Boolean);

	render() {
		const { json, query, dataEntries, wikiEntries, speciesEntries, noResults, url } = this.state;
		return [
			RCE('div', { className: 'data' },
				RCE('form', { action: 'search', method: 'get', className: 'search-form' },
					RCE('i', null, '🔍'),
					RCE('input', { type: 'text', name: 'q', id: 'search', placeholder: query })
				),
				RCE('div', { className: 'response-header' },
					RCE('i', null, '📦'),
					RCE('span', null, 'API response')
				),
				RCE('textarea', { readOnly: true, id: 'response', defaultValue: json })
			),
			RCE('div', { className: 'tabs' },
				RCE(WikiSection, { icon: '🗂️', title: 'Wikidata', data: dataEntries }),
				RCE(WikiSection, { icon: '📖️', title: 'Wikipedia', data: wikiEntries}),
				RCE(WikiSection, { icon: '🧬', title: 'Wikispecies', data: speciesEntries}),
				noResults ? RCE('h4', null, 'No results') : null
			),
			RCE('div', { className: 'browser' },
				RCE('div', { className: 'url-wrapper' },
					RCE('i', null, '🌐'),
					RCE('span', { id: 'url' }, url)
				),
				RCE('iframe', { readOnly: true, src: url, id: 'iframe' }),
				RCE('div', { id: 'iframe-loader' })
			)
		];
	}
};
