import { blake256, H512, recoverSchnorr } from "codechain-primitives";
import * as RLP from "rlp";

import {
    ConsensusMessage,
    decodeMessage,
    messageToEncodeObject
} from "../message";
import { decodeUInt } from "../util";

export interface ReportDoubleVoteJSON {
    message1: ConsensusMessage;
    message2: ConsensusMessage;
}

export default class ReportDoubleVote {
    public static ACTION_ID = 5;

    public static fromEncodeObject(object: any): ReportDoubleVote {
        if (!Array.isArray(object) || object.length !== 3) {
            throw new Error(
                "RLP of the ReportDoublevote action must be an array of length 3"
            );
        }

        if (decodeUInt(object[0]) !== ReportDoubleVote.ACTION_ID) {
            throw new Error(
                `Tag of the ReportDoublevote action must be ${ReportDoubleVote.ACTION_ID}`
            );
        }
        return new ReportDoubleVote(
            decodeMessage(object[1]),
            decodeMessage(object[2])
        );
    }

    public readonly message1: ConsensusMessage;
    public readonly message2: ConsensusMessage;

    public constructor(message1: ConsensusMessage, message2: ConsensusMessage) {
        this.message1 = message1;
        this.message2 = message2;
    }

    public get type(): "reportDoubleVote" {
        return "reportDoubleVote";
    }

    public criminal(): H512 {
        const { message1 } = this;
        const digest = blake256(RLP.encode(messageToEncodeObject(message1)[0]));
        const signature = message1.signature.toString();
        const pubkey = recoverSchnorr(digest, {
            r: signature.slice(0, 64),
            s: signature.slice(64)
        });
        return H512.ensure(pubkey);
    }

    public toBytes(): Buffer {
        const { message1, message2 } = this;

        return RLP.encode([
            ReportDoubleVote.ACTION_ID,
            messageToEncodeObject(message1),
            messageToEncodeObject(message2)
        ]);
    }
}
