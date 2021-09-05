import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Title from './components/Title'
import AppTest from './components/AppTest'
import Recipe from './components/Recipe';
import AddRecipe from './components/AddRecipe';
import { BrowserRouter, Switch, Route, useHistory } from "react-router-dom"

function App(){
  const history = useHistory();
  return (
    <div>
      <Title history={history}/>
      <Switch>
        <Route exact path="/">
          <AppTest history={history} />
        </Route>
        <Route path="/recipe" component={Recipe}>
          <Recipe />
        </Route>
        <Route path="/addRecipe" component={AddRecipe}>
          <AddRecipe history={history}/>
        </Route>
      </Switch>
    </div>
  );
}

ReactDOM.render(<BrowserRouter><App /></BrowserRouter>,
  document.getElementById('root'));