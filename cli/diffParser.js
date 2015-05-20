/*
 * This first section is directly related to processing and returning the
 * git diff output. There are 2 main parts
 *  * Calling 'git diff" and getting that output
 *  * Turning the 'git diff' output into chunks about each individual file that changed
 */

/*
 *   Calls git diff on given location, and returns the output as a string
 */
    // Get the current working directory so we can go back to it once finished

    // Find the path for where we need to go and go there

    //Now just go back to where we started and return the diff
/*
 *
 *  Convert the whole diff string into chunks separated by the diff header
 *  which specifies the file that was changed. This gets us diffs separated by
 *  file, and each diff has the info about the diff for that specific file
 */
    // Via the git diff spec, this is the pattern we want to look for for each different file
    //Find all the indices for matches so we know where to "cut" later to get the file-diffs
    //Now just go through and take the sections that make up the diffs for each file.
/*
 * Given the file granules, which are the file-specific diffs, convert those
 * into an object format the allows for easy access of different pieces of info
 * about the diff
 */

    // We want to get the header and body separate so that we can then process each part separately
    // additionally, we are going to do what processing for the header we can at this step to prevent
    // the need for another loop
        // First, split the granule into header and body, where the body is the part
        // that contains the actual diff about what changed, and the header is information
        // about what type of change that git thinks it is
        // Next, just interpret the header to get some more information about it
        // Now, just get the old and new versions of the file so we can see the before and after.
        var fileVersions = getFileVersionArraysFromBody(splitGranuleObject.body);

    // For each interpreted granule, turn the version arrays into one item that can be used in the future.
        convertedFileVersions.push(convertVersionArraysToObjects(granule));

    // Now, just change the format slightly by flattening the structure some.
    convertedFileVersions.forEach(function(granule){
        if(diffObject !== null) diffObjects.push(diffObject);
    });
    return diffObjects;
/*
 * Split the diff about each file into its header and body and return it in an object that has these separated.
 */
function splitGranuleIntoHeaderAndBodyObject(granule) {
    var firstIndex = granule.indexOf("@@");
    if(firstIndex == -1) {
        //No occurrence of @@, so we need to just return the whole thing as the header
        return {header: granule, body: ""};
        //Otherwise, need to add 2 since we're looking for 2 characters
        firstIndex += 2;
    // The +2 is because we are looking for 2 characters, the other +1 is for the \n
    var secondIndex = firstIndex + (granule.substring(firstIndex, granule.length).indexOf("@@") + 2) + 1;
    return {header: granule.substring(0, secondIndex), body: granule.substring(secondIndex, granule.length)};
/*
 * Interpret the header by finding what git thinks the change type is, then resolve the change type that git reports
 * into a change type that gitlit will display and report.
 */
    // The first line looks like this: git diff a/path/to/file/file.extension b/path/to/file/file.extension
    // So we want to split up this line so we can see where the file was before and after for change identification
    // get the paths without the a/ or /b
    var oldFilePath = itemizedHeader[2].substring(2,itemizedHeader[2].length);
    var newFilePath = itemizedHeader[3].substring(2,itemizedHeader[3].length);
    // Now we just do our processing on the header to find the gitlit change type. For info on how
    // this works, look at these methods.

/*
 * Interpret the 'git diff' header to find what type of change occurred preliminarily.
 * This change is based on what git reports, and extracts information that is pertinent to
 * each change type.
 * For example, if there is a new file, then the old parent and ID doesn't
 * mean anything, so just give it the new parent and ID.
 */
function interpretChangeType(headerLines) {
    var changeType = null;
    var changeTypeLines = [];
    var changeTypeList = [
        {type: "deleted", pattern: /(deleted file mode)/g},
        {type: "added", pattern: /(new file mode)/g},
        {type: "rename", pattern: /(rename from)/g},
        {type: "rename", pattern: /(rename to)/g}
    ];

    //Check all of the lines for any reporting from git to see what type of change git thinks it is.
    for (var headerIndex = 0; headerIndex < headerLines.length; headerIndex++) {
        for(var index = 0; index<changeTypeList.length; index++) {
            if (changeTypeList[index].pattern.test(headerLines[headerIndex])) {
                changeTypeLines.push(headerLines[headerIndex]);
                changeType =  changeTypeList[index].type;
            }
        }

    var oldId = null;
    var oldParent = null;
    var newId = null;
    var newParent = null;

    // We need to extract more information about what the id and parent of the thing that changed are.
    // For deletes and adds, there is no possible inconsistency, so when we later look at the old and
    // new paths to resolve things for renames, we can just take what we find for those changes; thus,
    // they can be null for now.
    if(changeType == null) {
        //Change type was never set, this means that we are looking at just a normal
        //file edit, so not much else to do
        changeType = 'edit';
    } else if (changeType == 'rename') {
        // Otherwise, if have gotten a rename, then we need to look on different lines for the before and after
        // parent and ID
        var splitRenameFrom = changeTypeLines[0].split('/');
        var splitRenameTo = changeTypeLines[1].split('/');
        oldParent = splitRenameFrom[splitRenameFrom.length-2];
        newParent = splitRenameTo[splitRenameTo.length-2];
        oldId = splitRenameFrom[splitRenameFrom.length-1];
        newId = splitRenameTo[splitRenameTo.length-1];
    }

    return {changeType:changeType, oldID:oldId, oldParent:oldParent, newID:newId, newParent:newParent};
/*
 * Resolve any inconsistencies between the old and new file paths and the interpreted change
 * data. Most of this is done for renames since there is some inconsistency for them.
 * For other changes, this just fills in any missing information.
 */
/*
 * Look at both the first and second ID's, and determine which of those two should be returned. In special cases,
 * return something else, such as looking for a parent ID at the topmost level where there IS no parent.
 */
            //This almost certainly means that the topmost level metadata file looking for the parent's id
            //so we should just return null, since there IS no parent
/*
 * Decides if a change type is a move by looking at the parents in a change-data. If they are different, then it is
 * obviously a move.
 */
function convertRenamesToMoves(data) {
    var toReturn = {changeType: data.changeType, oldParent:data.oldParent, newParent:data.newParent, oldID:data.oldID, newID:data.newID};
    if(toReturn.oldParent != toReturn.newParent) {
        //since renames must be either a file that was renamed for some reason, or a move, then if the parents are different,
        //by definition, it is a move
        toReturn.changeType = 'move';
    return toReturn;
/*
 * Read the body, and create an old and new file version based on the
 * symbols used by git to show what is old and new.
 */
function getFileVersionArraysFromBody(body) {
/*
 * Given an object that tells what symbol is 'good', take lines
 * that start with that or ' ' (' ' means that there was no change).
 */
        if(fileArray[line][0] == ' ' || fileArray[line][0] == template.idSymbol) {
            fileLines.push(lineToAdd)
/*
 * Given a granule that has been split into interpreted header and a body that is split into 2 arrays,
 * one for the old body, and one for the new body, got through and turn this into an object with the
 * interpreted header, and one item for each the old and new version of the body.
 *
 * In the case of metadata files, actually read the JSON so we can get some meaninful information later.
 * For text files, just return strings.
 */
function convertVersionArraysToObjects(granule) {
    var oldNode;
    var newNode;

    if(granule.fileInfo.oldID == 'metadata' || granule.fileInfo.newID == 'metadata') {
        // We will want to eventually be able to look at metadata files to determine when some things change,
        // So we need to parse that text before and after so we get the old and new metadata.
        var oldNodeText = '';
        var newNodeText = '';
        if(granule.versions.oldFile.length > 0) {
            var oldContent = granule.versions.oldFile[0];
            oldNodeText = oldContent.substring(1,oldContent.length);
        }
        if(granule.versions.newFile.length > 0) {
            var newContent = granule.versions.newFile[0];
            newNodeText = newContent.substring(1,newContent.length);
        }

        //We can just references the first element straight away since we
        //make all our json files one line long
        oldNode = oldNodeText == '' ? null : JSON.parse(oldNodeText);
        newNode = newNodeText == '' ? null : JSON.parse(newNodeText);

        // If it's just a text file, just read the old and new versions in.
        oldNode = "";
        newNode = "";

        granule.versions.oldFile.forEach(function(line){
            if(oldNode.length > 0) {
                //This means that there have been lines appended already,
                //as such, this line that we are about to append needs to
                //come on a new line.
                oldNode += '\n';
            }
            oldNode += line.substring(1,line.length);
        });
        granule.versions.newFile.forEach(function(line){
            if(newNode.length > 0) {
                //This means that there have been lines appended already,
                //as such, this line that we are about to append needs to
                //come on a new line.
                newNode += '\n';
            }
            newNode += line.substring(1,line.length);
        });


    return {fileInfo: granule.fileInfo, versions: {old: oldNode, new: newNode}};
/*
 * Given a diff granule, flatten the structure some so that it is easier to make use of
 * Additionally, for edits, update the information about _what_ changed to be accurate.
 */
function convertToDiffObject(granule) {
    if(granule.fileInfo.changeType == 'added') {
        //new file, whether it is completely new, or just a
        //large edit, doesn't really matter, either way,
        //just trim the info accordingly
        return {changeType: 'added', objectID: granule.fileInfo.newID,
                parent: granule.fileInfo.newParent, content: granule.versions.new};
    } else if(granule.fileInfo.changeType == 'deleted') {
        //file was deleted, again, just trim info to be clean
        return {changeType: 'deleted', objectID: granule.fileInfo.oldID,
            parent: granule.fileInfo.oldParent, content: granule.versions.old};
    } else if(granule.fileInfo.changeType == 'edit') {
        //The file was edited but didn't change otherwise
        //This can only really happen with metadata files
        //that don't get moved, as such, we need to hold
        //to both the old and new versions
        var oldID = null;
        var newID = null;

        if('attributes' in granule.versions.old) {
            granule.versions.old.attributes.forEach(function (attribute) {
                if (attribute.name == 'por-id') {
                    oldID = attribute.value;
            });
        }

        if('attributes' in granule.versions.new) {
            granule.versions.new.attributes.forEach(function (attribute) {
                if (attribute.name == 'por-id') {
                    newID = attribute.value;
                }
            });
        }
        return {changeType: 'edit',
                old:{ID: oldID,
                     parent: granule.versions.old.parentID,
                     content: granule.versions.old},
                new:{ID: newID,
                    parent: granule.versions.new.parentID,
                    content: granule.versions.new}
        };
    } else if (granule.fileInfo.changeType == 'move') {
        //The file was moved, with no content changing
        //There is another move case that can come up, which is the result of moving within
        //a certain parent, but this requires some comparison against the metadata changes, which
        //are not in place yet.
        return {changeType: 'move',
                old:{ID: granule.fileInfo.oldID,
                     parent: granule.fileInfo.oldParent},
                new:{ID: granule.fileInfo.newID,
                     parent: granule.fileInfo.newParent}
        //Otherwise, we are looking at a rename that is hard to place,
        //it could be nothing or an internal node move, either way, we should
        //hold on to it, to see if we can resolve it later.
        return {changeType: '?', granule: granule};
/*
 * Given a list of diff objects, resolve any changes that require digging into altered metadata.
 */
    var unknownChangesToBeResolved = [];

    // Identify 'normal' changes that have been identified to completion, and put them into a separate
    // list for later possible use. Any changes that we have yet to identify might be able to be identified
    // in this process, so separate those as well.
        if(diff.changeType == '?') {
        }
        else if(diff.changeType != 'edit') {
    // Go through any edits, and see if it was slightly mis-identified, and separate it into either an edit that needs
    // further resolution, or an internal move. Look at unknown changes as well in case
    // they help. If the change type isn't an edit, or unknown, then that change type is fine
    // Attempt further resolution of complicated edits
    // Combine all the things we've resolved into one diff list.
/*
 * Look at the old and new versions of an object, and attempt to identify what type of change it really is
 * Unknown changes where can help identify certain cases.
 */
    // TODO: At some point, we will want to add metadata change identification.
    //We need to look at the children, and separate these changes out so they can be resolved against
            // Look to see if there are any unknown changes that match up with this id

                newChild.indexOf('.txt') > -1 &&
                unknownMatch.granule.fileInfo.newID == newChild.slice(0, newChild.indexOf('.txt'))) {
                    oldFile: oldChild,
                    newFile: newChild};
/*
 * Given changes, deduplicate the edits so that there is only one entry for each 'item' that changed
 */

        // For each edit, find the old and new id
        // look to see if there is any other change that is part of this edit, that LOOKED like something
        // else and was identified as such, perhaps an add for example.
        // If we found a match, just deduplicate this change so there is one entry
/*
 * Given a gitlit object that represents a document, extract the body of that document.
 */
function extractBodyObject(gitlitObject) {
    if (gitlitObject.metadata != undefined){
        var metadata = gitlitObject.metadata;
        var tag = metadata.tag;
        if(tag == 'body') {
            return gitlitObject;
        } else {
            var toReturn = null;
            for(var index = 0; index < gitlitObject.children.length; index++) {
                var child = gitlitObject.children[index];
                toReturn = extractBodyObject(child);
                if(toReturn != null) {
                    return toReturn;
                }
            }
        }
    } else {
        return null;
    }
}

/*
 * Remove the attributes from the gitlit object since we can't have them present when we show our diff, as it
 * could create problems with rendering the diff.
 */
/*
 * Given a gitlit object representing a document, and the diff objects that represent changes to nodes,
 * mark the elements in the gitlit object with the appropriate diff objects so that the gitlit object
 * nodes know how they changed.
 */
/*
 * Given a diff object and a gitlit object that represents a document, traverse the document, and add the
 * diff information to the appropriate node.
 */
/*
 * Given a gitlit object, go through and flatten the whole thing by placing things
 * into a list in the order which they would be found if going through the document structure.
 */
function flattenGitlitObject(gitlitObject) {
        // If the object has no children, just return a list of it alone so that it can be concatenated later.
        var flattenedChildren = [];
        //Go through and flatten the children of this object
            flattenedChildren = flattenedChildren.concat(flattenGitlitObject(child))
        //Once all the children have been flatten, make note the number of children to look for when we
        //restore the document to it's tree-like structure.
        return [newObject].concat(flattenedChildren);
/*
 * Given two flattened objects, pair up each of the items in these objects to where
 * they create "rows" that represent what each node should be next to in the rendered
 * diff.
 */

    //If there are any un-paired elements in the old or new nodes, pair them up with empty nodes
/*
 * Given two sides that might be things that should be lined up, decide if they should be, and return the pair
 * that represents one row in the rendered diff.
 */
    // If one side is null, just return what we can from the other
        //If neither of these objects has been changed, just increment the index and return the objects
        //If we are loking at an edit on both sides, then these are fine to be together, so just leave these
        //together and return the items.
/*
 * Label each different unique edit and move so that a button is only given to each indivdual change one time
 */
function labelUniqueMovesAndEdits(pairs) {
    var changeIDs = [];
    var decisionNumber = 0;

    pairs.forEach(function(pair){
        var changeId = "";
        if(pair.left != null) {
            if(pair.left.diffMetadata != undefined || pair.left.diffMetadata != null) {
                // If the left side has a diff, it might be a type that we want to label
                if(pair.left.diffMetadata.changeType == "edit") {
                    //If it's an edit, then we should see if we've labeled this diff already, if not,
                    //then we need to label it and add it to the list of what we've labeled
                    changeId = pair.left.diffMetadata.oldID + pair.left.diffMetadata.newID;
                    if(changeIDs.indexOf(changeId) == -1){
                        changeIDs.push(changeId);
                        pair.left.diffMetadata.decisionNumber = decisionNumber + "m";
                        decisionNumber += 1;
                    }
                } else if (pair.left.diffMetadata.changeType == "move") {
                    //If it's a move, then we should see if we've labeled this diff already, if not,
                    //then we need to label it and add it to the list of what we've labeled
                    changeId = pair.left.diffMetadata.old.ID + pair.left.diffMetadata.new.ID;
                    if(changeIDs.indexOf(changeId) == -1){
                        changeIDs.push(changeId);
                        pair.left.diffMetadata.decisionNumber = decisionNumber + "m";
                        decisionNumber += 1;
                    }
                }
            }
        }
        changeId = "";
        if(pair.right != null) {
            if(pair.right.diffMetadata != undefined || pair.right.diffMetadata != null) {
                // If the right side has diff, then it might be one we want to label
                if(pair.right.diffMetadata.changeType == "edit") {
                    //If it's an edit, then we should see if we've labeled this diff already, if not,
                    //then we need to label it and add it to the list of what we've labeled
                    changeId = pair.right.diffMetadata.oldID + pair.right.diffMetadata.newID;
                    if(changeIDs.indexOf(changeId) == -1){
                        changeIDs.push(changeId);
                        pair.right.diffMetadata.decisionNumber = decisionNumber + "m";
                        decisionNumber += 1;
                    }
                } else if (pair.right.diffMetadata.changeType == "move") {
                    //If it's a move, then we should see if we've labeled this diff already, if not,
                    //then we need to label it and add it to the list of what we've labeled
                    changeId = pair.right.diffMetadata.old.ID + pair.right.diffMetadata.new.ID;
                    if(changeIDs.indexOf(changeId) == -1){
                        changeIDs.push(changeId);
                        pair.right.diffMetadata.decisionNumber = decisionNumber + "m";
                        decisionNumber += 1;
                    }
                }
            }
        }
    });
}

/*
 * Given the flattened pairs, go through and give each pair a row number
 */
/*
 * Add the class name for the given row number to each object in the pair
 */
/*
 * Split the pairs back into separate, flattened bodies. This is the inverse of pairUpRows
 */
/*
 * Return an emptyNode with the given row number, id, and parent id
 */
/*
 * Go through the node list, and recursively reconstruct the nodes that make up the document
 */
        //We have children, so we need to convert those back into the proper format
        //This is all of the things that come after the current node, so they MIGHT be children of this node
        //This node knows about a certain number of children, so we should pick up that many, however, because
        //each of THOSE children may have children themselves, we have no idea what the list of possible children
        //will look like, so just trust the children that we tell to be reconstructed to give us an accurate list
        //of what children we should add next
        //While this current node may know about some number children, we may have inserted some empty children that know
        //this node should be their parent for the sake of diffing. If that is so, go ahead and add those as well
        //span for proper diff displaying and then return it
/*
 * Add the information into the node so that knows what row and decision number it is.
 */
    var changeClassNameDict = {
        added : "ins",
        deleted: "del",
        move: "mov",
        edit: "edt"
    };
        var decisionNumber =  (textNode.diffMetadata.decisionNumber != undefined || textNode.diffMetadata.decisionNumber != null) ?
                              textNode.diffMetadata.decisionNumber : '';
            value: textNode.row.toString() + ' ' + changeClassNameDict[textNode.diffMetadata.changeType] + ' ' + decisionNumber}];
        metadata: {tag: 'span',
            attributes: attributes,
            constructionOrder: [textNode.porID]},
        children: [{value: textNode.value,
            podID: textNode.porID}]
    };
/*
 * Given a gitlit object that represents a document, convert that to HTML by either returning the text
 * for text nodes, or the HTML node if they have a tag
 */
/*
 * Given an object that should have a tag, recursively reconstruct it and its children into HTML
 */
        "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
    flattenGitlitObject: flattenGitlitObject,
    labelUniqueMovesAndEdits: labelUniqueMovesAndEdits