const wikitaxa = require('./lib');

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const express = require('express');
const app = express();

let port = process.env.PORT;

if (port == null || port == "") {
	port = 5000;
}

const fetchData = async (res, query, sendResult = true) => {
	const data = await wikitaxa.performSearch(query);
	redis.set(query, JSON.stringify(data));

	if (sendResult) {
		res.send(data);
	} else {
		return { name: query, data };
	}
};

const getData = (res, query) => {
	redis.get(query, (err, result) => {
		if (result) {
			console.warn(`🗃️ Cache: '${query}'`);
			res.send(result);
		} else {
			console.warn(`🔍 Searching for: '${query}'`);
			return fetchData(res, query);
		}
	});
};

app.get('/', (req, res) => res.send({}));

app.get('/purge/:q', (req, res) => {
	const query = req.params.q;
	redis.del(query);
	res.send({ result: `'${query}' deleted!` });
});

app.get('/list', async (req, res) => {
	const keys = await redis.keys('*');
	const data = keys.map(async k => ({
		name: k,
		data: JSON.parse(await redis.get(k, (err, data) => data || '{}'))
	}));
	Promise.all(data).then(results => {
		res.send({ keys, results });
	});
});

app.get('/search/:q', async (req, res) => {
	const query = req.params.q;
	if (!query.includes(".") && !query.includes("/")) {
		if (!query.includes(",")) {
			getData(res, query);
		} else {
			const list = query.split(',');
			const queue = list.map(async q => await fetchData(null, q, false));
			Promise.all(queue).then(results => {
				res.send({ list, results });
			});
		}
	} else {
		res.send({});
	}
});

app.listen(port);
