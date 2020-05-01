import Card from './Card';
import { CardType, generateTabletopOutput } from './Tabletop';
import { getDeckFromURL, isValidHttpUrl } from './DeckURL';
import { getName, getNumInstances, compareToCommanders, downloadPrompt } from './Utils';

const DEFAULT_RESPONSE = "";


// Perhaps build in a delay here to prevent Scryfall from overloading.
async function performQueries(promises: any[]) {
    return Promise.all(promises);
}



async function download(form: any): Promise<string> {
    let commander: string = form.commander;
    let partner: string = form.partner;
    let decklistForm: string = form.decklist;

    let commanderIndices: number[] = [];
    let promises: any[] = [];
    let cards: Card[] = [];

    if (commander === "" && decklistForm === "") {
        return DEFAULT_RESPONSE;
    }

    let decklist: string[] = decklistForm.split("\n");

    // Handle URLs
    if (isValidHttpUrl(decklist[0])) {
        decklist = await getDeckFromURL(decklist[0]);
    }

    let hasCommander = commander !== "";
    if (partner !== "") {
        commander += "\n" + partner;
    }
    let commanders = commander.split("\n")
        .filter((c: string) => { return c.trim() !== "" })
        .map((c: string) => { return getName(c) });

    // Build decklist with queries
    decklist.forEach((line: string, index: number) => {
        if (line === "" || line.startsWith("//")) {
            return;
        }
        line = line.trim();
        let numInstances = getNumInstances(line);
        let name = getName(line);
        let tmpCard = new Card(name, numInstances, CardType.Default);

        if (hasCommander) {
            let isCommander = compareToCommanders(commanders, name);
            if (isCommander) {
                tmpCard.setCardType(CardType.Commander);
                commanderIndices.push(index);
            }
        }
        cards.push(tmpCard);
        promises.push(tmpCard.getCardPromise());
    });

    // Add commander if not present in main deck
    if (hasCommander && commanderIndices.length === 0) {
        commanders.forEach((line) => {
            if (line === "" || line.startsWith("//")) {
                return;
            }
            line = line.trim();
            let name = getName(line);
            let tmpCard = new Card(name, 1, CardType.Commander);
            commanderIndices.push(cards.length);
            cards.push(tmpCard);
            promises.push(tmpCard.getCardPromise());
        })
    }

    // collect
    await performQueries(promises);

    // Postprocess tokens, flip and additional cards
    let postPromises: any[] = [];
    let tokens: { [key: string]: boolean } = {};

    cards.forEach(card => {
        // Handle tokens
        if (card.tokens.length !== 0) {
            card.tokens.forEach((token: any) => {
                // if this token is already present in the list.
                if (token.name in tokens) {
                    return;
                }
                tokens[token.name] = true;
                let tmpCard = new Card("", 1, CardType.Additional);
                tmpCard.setUri(token.uri);
                cards.push(tmpCard);
                postPromises.push(tmpCard.getCardPromise());
            })
        }
        // Handle flip cards
        if (card.cardType === CardType.Flip) {
            // if we already have a double backed token for this card we just modify this one to go in the main deck.
            if (card.name in tokens) {
                card.setCardType(CardType.Default);
                card.setBackUrl("");
                return;
            }

            let tmpCard = new Card(card.name, card.numInstances, card.cardType);
            Object.assign(tmpCard, card);
            tmpCard.setBackUrl(""); // reset to cardback
            tmpCard.setCardType(CardType.Default); // add a copy with hidden back to main deck
            cards.push(tmpCard);

            // make sure 1 double faced card gets put in the token stack
            card.setCardType(CardType.Additional);
            card.setNumInstances(1);
            tokens[card.name] = true;
        }
    });

    // collect
    await performQueries(postPromises);

    // Error building
    let errors: string[] = [];
    cards.forEach((card: any) => {
        if (card.failed) {
            errors.push(card.name);
        }
    });
    // Return before download prompt
    if (errors.length > 0) {
        return errors.join("\n")
    }

    // Build JSON structure
    let hasAdditional = Object.keys(tokens).length > 0;
    let tabletopOutput = generateTabletopOutput(cards, hasAdditional, hasCommander);
    let fileName = "";
    if (hasCommander) {
        fileName = cards[commanderIndices[0]].name + ".json";
    } else {
        fileName = cards[0].name + ".json";
    }
    
    downloadPrompt(fileName, tabletopOutput);

    return DEFAULT_RESPONSE;
}

export default download