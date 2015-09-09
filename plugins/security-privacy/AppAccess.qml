/*
 * Copyright (C) 2013 Canonical Ltd
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Authors:
 * Alberto Mardegan <alberto.mardegan@canonical.com>
 */

import QtQuick 2.0
import Ubuntu.Components 0.1
import Ubuntu.Components.ListItems 0.1 as ListItem
import Ubuntu.SystemSettings.SecurityPrivacy 1.0
import SystemSettings 1.0

ItemPage {
    id: root
    title: i18n.tr("App permissions")

    Flickable {
        anchors.fill: parent
        contentHeight: contentItem.childrenRect.height
        boundsBehavior: (contentHeight > root.height) ?
                            Flickable.DragAndOvershootBounds :
                            Flickable.StopAtBounds
        /* Set the direction to workaround
           https://bugreports.qt-project.org/browse/QTBUG-31905 otherwise the UI
           might end up in a situation where scrolling doesn't work */
        flickableDirection: Flickable.VerticalFlick

        Column {
            anchors.left: parent.left
            anchors.right: parent.right

            ListItem.Caption {
                text: i18n.tr("Apps that you have granted access to:")
            }

            ListModel {
                id: appsModel
                ListElement {
                    name: QT_TR_NOOP("Camera")
                    caption: QT_TR_NOOP("Apps that have requested access to your camera")
                    trustStoreService: "CameraService"
                }
                ListElement {
                    name: QT_TR_NOOP("Location")
                    caption: QT_TR_NOOP("Apps that have requested access to your location")
                    trustStoreService: "UbuntuLocationService"
                }
                ListElement {
                    name: QT_TR_NOOP("Microphone")
                    caption: QT_TR_NOOP("Apps that have requested access to your microphone")
                    trustStoreService: "PulseAudio"
                }
            }

            Repeater {
                model: appsModel

                ListItem.SingleValue {
                    text: i18n.tr(model.name)
                    enabled: trustStoreModel.count > 0
                    progression: enabled ? true : false
                    value: trustStoreModel.count > 0 ?
                        i18n.tr("%1/%2").arg(trustStoreModel.grantedCount).arg(trustStoreModel.count) :
                        i18n.tr("0")
                    onClicked: pageStack.push(Qt.resolvedUrl("AppAccessControl.qml"), {
                        "title": i18n.tr(model.name),
                        "caption": i18n.tr(model.caption),
                        "model": trustStoreModel,
                    })

                    TrustStoreModel {
                        id: trustStoreModel
                        serviceName: model.trustStoreService
                    }
                }
            }

            ListItem.Caption {
                    text: i18n.tr("Apps may also request access to online accounts.")
            }

            ListItem.SingleControl {
                control: Button {
                    text: i18n.tr("Online Accounts…")
                    width: parent.width - units.gu(4)
                    onClicked: {
                        var upPlugin = pluginManager.getByName("online-accounts")
                        if (upPlugin) {
                            var updatePage = upPlugin.pageComponent
                            if (updatePage)
                                pageStack.push(updatePage)
                            else
                                console.warn("online-accounts")
                        } else {
                            console.warn("online-accounts")
                        }
                    }
                }
                showDivider: false
            }
        }
    }
}
