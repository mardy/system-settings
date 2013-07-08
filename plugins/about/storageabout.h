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
 * Sebastien Bacher <sebastien.bacher@canonical.com>
 *
*/

#ifndef STORAGEABOUT_H
#define STORAGEABOUT_H

#include <QObject>
#include <QProcess>

class StorageAbout : public QObject
{
    Q_OBJECT
    Q_PROPERTY( QString OsVersion
                READ OsVersion
                CONSTANT)

    Q_PROPERTY( QString serialNumber
                READ serialNumber
                CONSTANT)

    Q_PROPERTY( QString vendorString
                READ vendorString
                CONSTANT)

public:
    explicit StorageAbout(QObject *parent = 0);
    ~StorageAbout();
    QString OsVersion();
    QString serialNumber();
    QString vendorString();

private:
    QString m_OsVersion;
    QString m_serialNumber;
    QString m_vendorString;
};

#endif // STORAGEABOUT_H