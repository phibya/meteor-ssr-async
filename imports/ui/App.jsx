import React, {useState, useEffect} from 'react'
import {useLocation} from "react-router-dom";

const useServerState = (defaultValue, method, args) => {
    let [state, setState] = useState(defaultValue)
    const key = JSON.stringify({method, args})

    if (Meteor.isServer) {
        const location = useLocation()
        const routerState = location.state.values
        const callAsync = location.state.callAsync

        if (routerState.has(key)) {
            state = routerState.get(key)
        } else {
            callAsync(method, args)
        }
    } else {
        useEffect(() => {
            const ssrState = window.__SSR_STATE__ || {}

            if (ssrState[key]) {
                setState(ssrState[key])
                return
            }

            Meteor.callAsync(method, args).then(setState)
        }, [method, args]);
    }

    return [state, setState]
}

export const App = () => {
    let [message1, setMessage1] = useServerState("Hello World from Client 1", "hello1", "params 1");
    let [message2, setMessage2] = useServerState("Hello World from Client 2", "hello2", message1);

    return (
        <div>
            <p>{message1}</p>
            <p>{message2}</p>
        </div>
    );
}
