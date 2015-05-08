/*
 * This file is part of system-settings
 *
 * Copyright (C) 2015 Canonical Ltd.
 *
 * Contact: Jonas G. Drange <jonas.drange@canonical.com>
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3, as published
 * by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranties of
 * MERCHANTABILITY, SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR
 * PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * This is a collection of functions to help dynamic creation and deletion
 * of ofono contexts.
 */

// Map of path to QOfonoContextConnection objects
var _pathToQml = {};

/**
 * Get the list model corresponding to a given type.
 *
 * @throws {Error} if the type was not mms|internet|ia
 * @param {String} type of model to get
 * @return {ListModel} model that matches type
*/
function getModelFromType (type) {
    var model;
    switch (type) {
        case 'mms':
            model = mmsContexts;
            break;
        case 'internet':
        case 'internet+mms':
            model = internetContexts;
            break;
        case 'ia':
            model = iaContexts;
            break;
        default:
            throw new Error('Unknown context type ' + type);
    }
    return model;
}

/**
 * Get QML for a context path.
 *
 * @param {String} path of context
 * @return {QOfonoContextConnection|null} qml from path or null if none found
*/
function getContextQML (path) {
    if (!_pathToQml.hasOwnProperty(path)) {
        return null;
    } else {
        return _pathToQml[path];
    }
}

/**
 * Given an array of paths, it will create and associate
 * an QOfonoContextConnection QML object for each new path.
 *
 * It will also delete any QML that is not in given list of paths.
 *
 * @param {Array} paths, array of operator paths
 */
function updateQML (paths) {
    console.warn('updateQML', paths);
    _garbageCollect(paths);
    _createQml(paths);
}

/**
 * Destroys QML and makes sure to remove from the
 * appropriate model.
 *
 * @param {String} path of object to delete
 * @return {Boolean} deletion successful
 */
function deleteQML (path) {
    var ctx;
    var i;
    if (!_pathToQml.hasOwnProperty(path)) {
        return false;
    } else {
        console.warn('Deleting QML for path', path);
        ctx = _pathToQml[path];

        [mmsContexts, internetContexts, iaContexts].forEach(function (model) {
            for (i = 0; i < model.count; i++) {
                if (ctx.contextPath == model.get(i).path) {
                    model.remove(i);
                    console.warn('Found QML in ListModel, removing', path, 'in', model.label);
                    break;
                }
            }
        });

        _pathToQml[path].destroy();
        delete _pathToQml[path];
        return true;
    }
}

/**
 * Removes QML that no longer exists in list of paths.
 *
 * @param {Array:String} paths we use as reference.
 */
function _garbageCollect (paths) {
    var path;
    for (path in _pathToQml) {
        if (_pathToQml.hasOwnProperty(path)) {
            if (paths.indexOf(path) === -1) {
                console.warn('_garbageCollect', path);
                deleteQML(path);
            }
        }
    }
}

/**
 * Creates QML for list in paths.
 *
 * @param {Array:String} list of paths
 * @param {String} path to the modem
 */
function _createQml (paths) {
    console.warn('_createQml...');
    var ctx;
    paths.forEach(function (path, i) {
        if (!_pathToQml.hasOwnProperty(path)) {

            ctx = createContextQml(path);
            console.warn('_createQml created', path, ctx.name, ctx.type);

            if (!ctx.name) {
                ctx.nameChanged.connect(contextNameChanged.bind(ctx));
            } else {
                contextNameChanged.bind(ctx)(ctx.name);
            }

            // Some context come with a type, others not. Normalize this.
            if (!ctx.type) {
                ctx.typeChanged.connect(typeDetermined.bind(ctx));
            } else {
                addContextToModel(ctx);
            }

            _pathToQml[path] = ctx;
        }
    });
}

/**
 * Creates a OfonoContextConnection qml object from a given path.
 * Since the components are all local, this will always return an object.
 *
 * @param {String} path of context
 * @return {OfonoContextConnection} qml that was created
*/
function createContextQml (path) {
    if (!_pathToQml.hasOwnProperty(path)) {
        return contextComponent.createObject(root, {
            'contextPath': path,
            'modemPath': sim.path
        });
    } else {
        return _pathToQml[path];
    }
}

/**
 * Creates a context of a certain type.
 *
 * @param {String} type of context to be created.
*/
function createContext (type) {
    console.warn('Creating context of type', type);
    sim.connMan.addContext(type);
}

/**
 * Removes a context. We don't remove any QML until we receive signal from
 * ofono that the context was removed, but we disconnect it if active.
 *
 * @param {String} path of context to be removed
*/
function removeContext (path) {
    console.warn('Removing context', path);
    var ctx = getContextQML(path);

    if (ctx && ctx.active) {
        ctx.disconnect();
    }

    sim.connMan.removeContext(path);
}

/**
 * Adds a context to the appropriate model.
 *
 * @param {OfonoContextConnection} ctx to be added
 * @param {String} [optional] type of context
*/
function addContextToModel (ctx, type) {
    var data = {
        path: ctx.contextPath,
        qml: ctx
    };
    var model;
    console.warn('addContextToModel', type, ctx.name, data.qml, data.path);

    if (typeof type === 'undefined') {
        type = ctx.type;
    }

    model = getModelFromType(type);
    model.append(data);
}

/**
 * Removes a context from the appropriate model.
 *
 * @param {OfonoContextConnection} ctx to be removed
 * @param {String} [optional] type of context
*/
function removeContextFromModel (ctx, type) {
    var model = getModelFromType(type);
    var i;

    if (typeof type === 'undefined') {
        type = ctx.type;
    }

    for (i = 0; i < model.count; i++) {
        if (model.get(i).path === ctx.contextPath) {
            model.remove(i);
            return;
        }
    }
}

/**
 * Handler for removed contexts.
 *
 * @param {String} path that was removed
*/
function contextRemoved (path) {
    var paths = sim.connMan.contexts.slice(0);
    var updatedPaths = paths.filter(function (val) {
        return val !== path;
    });
    _garbageCollect(paths);
}

/**
 * Handler for when a type has been determined.
 * @param {String} type
 */
function typeDetermined (type) {
    console.warn('typeDetermined', type, this.contextPath);
    addContextToModel(this, type);
}

/**
 * This is code that is supposed to identify new contexts that user creates.
 * If we think the context is new, and the editor page is open, we notify it.
 *
 * @param {String} name's new value
*/
function contextNameChanged (name) {
    console.warn('contextNameChanged', name);
    switch (name) {
        case 'Internet':
        case 'IA':
        case 'MMS':
            if (editor) {
                console.warn('We saw what we thought was ofono default. Notifying editor...');
                editor.newContext(this);
            }
            break;
    }
    this.nameChanged.disconnect(contextNameChanged);
}

/**
 * Handler for added contexts.
 *
 * @param {String} path which was added
 */
function contextAdded (path) {
    console.warn('contextAdded', path);
    _createQml([path]);
}

/**
 * Handler for when contexts change.
 *
 * @param {Array:String} paths after change
 */
function contextsChanged (paths) {
    console.warn('contextsChanged', paths);
    updateQML(paths);
}

/**
 * Handler for when errors are reported from ofono.
 *
 * @param {String} message from libqofono
 */
function reportError (message) {
    console.error(message);
}

/**
 * Set Preferred on a batch of contexts to false.
 *
 * @param {String} type of context to de-prefer
*/
function dePreferAll (type) {
    var model = getModelFromType(type);
    var ctx;
    var i;
    for (i = 0; i < model.count; i++) {
        ctx = model.get(i).qml;
        console.warn('dePreferContext',
                     ctx.contextPath);
        ctx.preferred = false;
    }
}

/**
 * Checks to see if a internet context is a combo context.
 *
 * @return {Boolean} whether or not context is combo type
 */
function isComboContext (ctx) {
    return ctx && ctx.type === 'internet' && ctx.messageCenter;
}

/**
 * Reset apn configuration.
*/
function reset () {
    sim.connMan.deactivateAll();
    sim.connMan.contexts.forEach(removeContext);
    SessionService.reboot();
}
