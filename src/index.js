import React from 'react'
import ReactDOM from 'react-dom'
import { Observable } from 'rxjs';
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { createEpicMiddleware, combineEpics } from 'redux-observable';
import { Machine, matchesState } from 'xstate';

const machine = Machine({
    initial: 'Init',
    states: {
        Init: {
            on: {
                FETCH_DATA_CLICKED: 'FetchingData',
            },
            initial: 'NoData',
            states: {
                ShowData: {},
                Error: {},
                NoData: {}
            }
        },
        FetchingData: {
            on: {
                FETCH_DATA_SUCCESS: 'Init.ShowData',
                FETCH_DATA_FAILURE: 'Init.Error',
                FETCH_DATA_CANCEL: 'Init.NoData',
            },
            onEntry: 'FETCH_DATA_REQUEST',
        },
    }
});

// function handleFetchDataRequest(action$, store, { ajax }) {
//     return action$.ofType('FETCH_DATA_REQUEST')
//         .mergeMap(action =>
//             ajax('http://foo.com')
//                 .mapTo({ type: 'FETCH_DATA_SUCCESS' })
//                 .takeUntil(action$.ofType('FETCH_DATA_CANCEL'))
//         )
// }

let lastStatechart = {};
function hasStatchartChanged(state) {
    const currentStatechart = getStatechart(state);
    if (!matchesState(lastStatechart, currentStatechart)) {
        lastStatechart = currentStatechart;
        return true;
    } else {
        return false;
    }
}
function handleStatechartsEffects(action$, store) {
    return action$
        .filter(action => hasStatchartChanged(store.getState()))
        .mergeMap(() => {
            const state = store.getState();
            // const statechart = getStatechart(state);
            // first run exits
            const exitArr = (getStatechartExit(state) || [])
                .map(action => ({ type: action }))

            // not supporting onTransition for now

            // then run enters
            const entryArr = (getStatechartEntry(state) || [])
                .map(action => ({ type: action }))

            console.log(exitArr, entryArr)

            return Observable.of(
                ...exitArr,
                ...entryArr
            )
        })
}

function getStatechartValue(state) {
    return state.statechart.value;
}

function getStatechart(state) {
    return state.statechart;
}

function getStatechartExit(state) {
    return state.statechart.effects.exit;
}
function getStatechartEntry(state) {
    return state.statechart.effects.entry;
}

function statechartReducer(state = machine.initial, action) {
    const nextState = machine.transition(state, action.type);
    if (nextState) {
        nextState.history = null; // XXX history blows out of proportions
        return nextState;
    } else {
        return state;
    }
}

const rootEpic = combineEpics(
    handleStatechartsEffects
)

const epicMiddleware = createEpicMiddleware(rootEpic);

const rootReducer = combineReducers({
    statechart: statechartReducer
});
const store = createStore(
    rootReducer,
    applyMiddleware(epicMiddleware)
);

const rootEl = document.getElementById('root')

const render = () => {
    // console.log(matchesState('Init', getStatechart(store.getState())))
    return ReactDOM.render(
      <div>
          {JSON.stringify(store.getState())}
          <br />


          <button onClick={() => store.dispatch({ type: 'FETCH_DATA_CLICKED' })}>fetch data</button>
          <button onClick={() => store.dispatch({ type: 'FETCH_DATA_CANCEL' })}>cancel</button>
      </div>,
      rootEl
  )
}

render()
store.subscribe(render)
