import * as dotenv from 'dotenv';
import * as vscode from 'vscode';
import { GoogleSearch, BingSearch, YahooSearch } from 'google-search-results-nodejs';

dotenv.config();

// Create search variables for each search engine
const apiKey = process.env.SEARCH_API_KEY;
const googleSearch = new GoogleSearch(apiKey);
const bingSearch = new BingSearch(apiKey);
const yahooSearch = new YahooSearch(apiKey);

// Activate function called only once (activation events are specified in package.json)
export function activate(context: vscode.ExtensionContext) {
	console.log('***** Error Query Extension Activated *****');

    // on active editor change, run syntax error search on file
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            errorSearch(editor.document.uri);
        }
	}));

    // on file edit, run syntax error search on file
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(editor => {
        if (editor) {
            errorSearch(editor.document.uri);
        }
	}));

    // on debug session start, run debug error search using session
    context.subscriptions.push(vscode.debug.onDidStartDebugSession(session => {
	    if (session) {
            debugErrorSearch(session);
        }
    }));

}


export  function debugErrorSearch(session: vscode.DebugSession): void {
    console.log("***** Start of debugErrorSearch() *****");

    // if there is a current debugging session, get exception messages from the current session
    var exceptionMessages: string[] = [];

    if (session) {
        session.customRequest('exceptionInfo', { "threadId": 1 })
        .then(response => {
            // console.log(response.details.typeName);
            exceptionMessages.push(response.details.typeName);
        })
        .then(undefined, err => {
            console.error(err);
        });
    
        // call getSearchResults with exception messages
        getSearchResults(exceptionMessages);
    }
}

// Uses serpApi to retrieve search results from Google, filters and displays top results to user
export  function errorSearch(uri: vscode.Uri): void {
    console.log("***** Start of errorSearch() *****");
    
    // get the current file's diagnostics
    var diagnostics = vscode.languages.getDiagnostics(uri);
    console.log(diagnostics);
    if (diagnostics === undefined) {
        console.log("No diagnostics found");
    }

    // iterate over the diagnostics and create an array of error messages
    var errorMessages: string[] = [];
    for (var i = 0; i < diagnostics.length; i++) {
        errorMessages.push(diagnostics[i].message);
        // console.log(diagnostics[i].message);
    }

    // call getSearchResults with errorMessages
    if(errorMessages.length > 0) {
        getSearchResults(errorMessages);
    }

}

// Uses serpApi to retrieve search results from Google, filters and displays top results to user
function getSearchResults(errorMessages: string[]) {
    console.log("***** Start of getSearchResults() *****");
    
    // array to hold search links
    var searchLinks: string[] = [];

    // for now, just use the first error message
    var errorMessage = errorMessages[0];  

    // create results variables for each search engine
    let googleResult = googleSearch.json({
        q: errorMessage }, 
        (data: any) => {
            searchLinks.push(data.organic_results[0].link);
            searchLinks.push(data.organic_results[1].link);
            searchLinks.push(data.organic_results[2].link);
            vscode.window.showInformationMessage("The following links may help you:", ...searchLinks).then(weblink => {
                if(weblink) {
                    vscode.env.openExternal(vscode.Uri.parse(weblink));
                }
            });
        }
    );
    // let bingResult = bingSearch.json({
    //     q: errorMessage
    //     }, (data: any) => {
    //         for(var i = 0; i < 5; i++) {
    //             searchLinks.push(data.organic_results[i]['link']);
    //             console.log(data.organic_results[i]['link']);
    //         } 
    // });
    // let yahooResult = yahooSearch.json({
    //     q: errorMessage
    //     }, (data: any) => {
    //         for(var i = 0; i < 5; i++) {
    //             searchLinks.push(data.organic_results[i]['link']);
    //             console.log(data.organic_results[i]['link']);
    //         } 
    // });
    
    // find all strings in searchLinks containing "stackoverflow" or "stackexchange"
    var bestLinks: string[] = [];
    var count = 0;

    for (var i = 0; i < searchLinks.length; i++) {
        // console.log(searchLinks[i]);
        if (searchLinks[i].includes("stackoverflow") || searchLinks[i].includes("stackexchange")) {
            console.log('here');
            bestLinks.push(searchLinks[i]);
            count++;
        }
    }

    // call showLinks with bestLinks
    // showLinks(searchLinks);
}

function showLinks(urls: string[]) {
    console.log("***** Start of showLinks() *****");
  
    vscode.window.showInformationMessage("The following links may help you:", ...urls).then(weblink => {
        if(weblink) {
            vscode.env.openExternal(vscode.Uri.parse(weblink));
        }
    });
}


// this method is called when your extension is deactivated
export function deactivate() {}