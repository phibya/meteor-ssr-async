import React from 'react';
import {Meteor} from 'meteor/meteor';
import {renderToString} from 'react-dom/server';
import {onPageLoad} from 'meteor/server-render';
import {StaticRouter} from 'react-router-dom/server';
import {App} from "../imports/ui/App";

Meteor.methods({
    "hello"(message) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(message)
            }, 1000)
        })
    }
})

onPageLoad(async sink => {

    const stateValues = new Map()
    const promises = new Map()
    const location = {
        ...sink.request.url,
        state: {
            values: stateValues,
            callAsync: (method, args) => {
                let key = JSON.stringify({method, args})
                if (stateValues.has(key)) return;
                let promise = Meteor.callAsync(method, args).then(value => {
                    stateValues.set(key, value)
                })
                promises.set(key, promise)
                return promise
            }
        }
    }

    const reactApp = (
        <StaticRouter location={location}>
            <App/>
        </StaticRouter>
    )

    let reactString = ""
    for (let i = 0; i < 10; i++) {
        reactString = renderToString(reactApp)
        if (!promises.size) break;
        await Promise.all(promises.values())
        promises.clear()
    }

    sink.renderIntoElementById('react-target', reactString);

    const stateObj = Array.from(stateValues.entries()).reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
    }, {})

    sink.appendToHead(`
        <script>
            window.__SSR_STATE__ = ${JSON.stringify(stateObj)}
        </script>
    `);
});
