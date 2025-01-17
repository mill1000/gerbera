/*GRB*
  Gerbera - https://gerbera.io/

  audio.js - this file is part of Gerbera.

  Copyright (C) 2023-2025 Gerbera Contributors

  Gerbera is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License version 2
  as published by the Free Software Foundation.

  Gerbera is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Gerbera.  If not, see <http://www.gnu.org/licenses/>.

  $Id$
*/

// Create layout that has a slot for each initial of the album artist
var object_ref_list;
function importAudioInitial(obj, cont, rootPath, autoscanId, containerType) {
    object_autoscan_id = autoscanId;
    object_ref_list = addAudioInitial(obj, cont, rootPath, containerType);
    return object_ref_list;
}

function addAudioInitial(obj, cont, rootPath, containerType) {

    // Note the difference between obj.title and obj.metaData[M_TITLE] -
    // while object.title will originally be set to the file name,
    // obj.metaData[M_TITLE] will contain the parsed title - in this
    // particular example the ID3 title of an MP3.
    var title = obj.title;

    // First we will gather all the metadata that is provided by our
    // object, of course it is possible that some fields are empty -
    // we will have to check that to make sure that we handle this
    // case correctly.
    if (obj.metaData[M_TITLE] && obj.metaData[M_TITLE][0]) {
        title = obj.metaData[M_TITLE][0];
    }

    var desc = '';
    var artist = [ 'Unknown' ];
    var artist_full = null;
    if (obj.metaData[M_ARTIST] && obj.metaData[M_ARTIST][0]) {
        artist = obj.metaData[M_ARTIST];
        artist_full = artist.join(' / ');
        desc = artist_full;
    }


    var aartist = obj.aux && obj.aux['TPE2'] ? obj.aux['TPE2'] : artist[0];
    if (obj.metaData[M_ALBUMARTIST] && obj.metaData[M_ALBUMARTIST][0]) {
       aartist = obj.metaData[M_ALBUMARTIST][0];
    }

    var disknr = '';
    if (obj.aux) {
        disknr = obj.aux['DISCNUMBER'];
        if (!disknr || disknr.length==0) {
           disknr = obj.aux['TPOS'];
        }
    }
    if (!disknr || disknr.length==0) {
        disknr = '';
    } else if (disknr == '1/1') {
        disknr = '';
    } else {
        var re = new RegExp("[^0-9].*","i");
        disknr = new String(disknr).replace(re,"");
    }

    var album = 'Unknown';
    var album_full = null;
    if (obj.metaData[M_ALBUM] && obj.metaData[M_ALBUM][0]) {
        album = obj.metaData[M_ALBUM][0];
        desc = desc + ', ' + album;
        album_full = album;
    }

    if (desc) {
        desc = desc + ', ';
    }
    desc = desc + title;

    var date = 'Unknown';
    if (obj.metaData[M_DATE] && obj.metaData[M_DATE][0]) {
        date = getYear(obj.metaData[M_DATE][0]);
        obj.metaData[M_UPNP_DATE] = [ date ];
        desc = desc + ', ' + date;
    }

    var genre= 'Unknown';
    if (obj.metaData[M_GENRE] && obj.metaData[M_GENRE][0]) {
        //genre = mapGenre(obj.metaData[M_GENRE][0]);
        genre = obj.metaData[M_GENRE][0];
        desc = desc + ', ' + genre;
    }

    if (!obj.metaData[M_DESCRIPTION] || !obj.metaData[M_DESCRIPTION][0]) {
        obj.description = desc;
    } else {
        obj.description = obj.metaData[M_DESCRIPTION][0];
    }

    var composer = 'None';
    if (obj.metaData[M_COMPOSER] && obj.metaData[M_COMPOSER][0]) {
        composer = obj.metaData[M_COMPOSER][0];
    }

    if (desc) {
         obj.description = desc;
    }

    var track = obj.metaData[M_TRACKNUMBER] ? obj.metaData[M_TRACKNUMBER][0] : ''; 
    if (!track) {
        track = '';
    } else {
        if (track.length == 1) {
            track = '0' + track;
        }
        if ((disknr.length > 0) && (track.length == 2)) {
          track = '0' + track;
        }
        if (disknr.length == 1) {
            obj.metaData[M_TRACKNUMBER] = [ disknr + '' + track ];
            track = '0' + disknr + ' ' + track;
        }
        else {
            obj.metaData[M_TRACKNUMBER] = [ disknr + '' + track ];
            if (disknr.length > 1) {
                track = disknr + ' ' + track;
            }
        }
        track = track + ' ';
    }

    if (artist.join(' - ') != aartist) {
        title = artist.join(' - ') + ' - ' + title;
    }

    obj.title = title;

    // We finally gathered all data that we need, so let's create a
    // nice layout for our audio files.

    // The UPnP class argument to addCdsObject() is optional, if it is
    // not supplied the default UPnP class will be used. However, it
    // is suggested to correctly set UPnP classes of containers and
    // objects - this information may be used by some renderers to
    // identify the type of the container and present the content in a
    // different manner.
    const parentCount = intFromConfig('/import/resources/container/attribute::parentCount', 1);
    const containerResource = parentCount > 1 ? cont.res : undefined;
    const containerRefID = cont.res.count > 0 ? cont.id : obj.id;

    const boxSetup = config['/import/scripting/virtual-layout/boxlayout/box'];
    const chain = {
        audio: {
            id: boxSetup[BK_audioRoot].id,
            title: boxSetup[BK_audioRoot].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioRoot].class,
            upnpShortcut: boxSetup[BK_audioRoot].upnpShortcut,
            metaData: [] },
        allAudio: {
            id: boxSetup[BK_audioAll].id,
            title: boxSetup[BK_audioAll].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAll].class,
            upnpShortcut: boxSetup[BK_audioAll].upnpShortcut,
            metaData: [] },
        allArtists: {
            id: boxSetup[BK_audioAllArtists].id,
            title: boxSetup[BK_audioAllArtists].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAllArtists].class,
            upnpShortcut: boxSetup[BK_audioAllArtists].upnpShortcut,
            metaData: [] },
        allGenres: {
            id: boxSetup[BK_audioAllGenres].id,
            title: boxSetup[BK_audioAllGenres].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAllGenres].class,
            upnpShortcut: boxSetup[BK_audioAllGenres].upnpShortcut,
            metaData: [] },
        allAlbums: {
            id: boxSetup[BK_audioAllAlbums].id,
            title: boxSetup[BK_audioAllAlbums].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAllAlbums].class,
            upnpShortcut: boxSetup[BK_audioAllAlbums].upnpShortcut,
            metaData: [] },
        allYears: {
            id: boxSetup[BK_audioAllYears].id,
            title: boxSetup[BK_audioAllYears].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAllYears].class,
            upnpShortcut: boxSetup[BK_audioAllYears].upnpShortcut,
            metaData: [] },
        allComposers: {
            id: boxSetup[BK_audioAllComposers].id,
            title: boxSetup[BK_audioAllComposers].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAllComposers].class,
            upnpShortcut: boxSetup[BK_audioAllComposers].upnpShortcut,
            metaData: [] },
        allSongs: {
            id: boxSetup[BK_audioAllSongs].id,
            title: boxSetup[BK_audioAllSongs].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAllSongs].class,
            upnpShortcut: boxSetup[BK_audioAllSongs].upnpShortcut,
            metaData: [] },
        allFull: {
            id: boxSetup[BK_audioAllTracks].id,
            title: boxSetup[BK_audioAllTracks].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAllTracks].class,
            upnpShortcut: boxSetup[BK_audioAllTracks].upnpShortcut,
            metaData: [] },
        allFullArtist: {
            id: boxSetup[BK_audioAllTracks].id,
            title: boxSetup[BK_audioAllTracks].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioAllTracks].class,
            metaData: [] },
        artistChronology: {
            id: boxSetup[BK_audioArtistChronology].id,
            title: boxSetup[BK_audioArtistChronology].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioArtistChronology].class,
            upnpShortcut: boxSetup[BK_audioArtistChronology].upnpShortcut,
            metaData: [] },
        all000: {
            id: boxSetup[BK_audioInitialAllArtistTracks].id,
            title: boxSetup[BK_audioInitialAllArtistTracks].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioInitialAllArtistTracks].class,
            upnpShortcut: boxSetup[BK_audioInitialAllArtistTracks].upnpShortcut,
            metaData: [],
            res: parentCount > 0 ? cont.res : undefined,
            aux: obj.aux,
            refID: containerRefID },
        abc: {
            id: boxSetup[BK_audioInitialAbc].id,
            title: boxSetup[BK_audioInitialAbc].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioInitialAbc].class },

        init: {
            title: '_',
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: UPNP_CLASS_CONTAINER },
        artist: {
            title: aartist,
            location: aartist,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: UPNP_CLASS_CONTAINER_MUSIC_ARTIST,
            metaData: [],
            res: containerResource,
            aux: obj.aux,
            refID: containerRefID },
        album: {
            title: album,
            location: getRootPath(rootPath, obj.location).join('_'),
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: containerType,
            metaData: [],
            res: parentCount > 0 ? cont.res : undefined,
            aux: obj.aux,
            refID: containerRefID },
        genre: {
            title: genre,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: UPNP_CLASS_CONTAINER_MUSIC_GENRE,
            metaData: [],
            res: containerResource,
            aux: obj.aux,
            refID: containerRefID },
        year: {
            title: date,
            objectType: OBJECT_TYPE_CONTAINER,
            searchable: true,
            upnpclass: UPNP_CLASS_CONTAINER,
            metaData: [],
            res: containerResource,
            aux: obj.aux,
            refID: containerRefID },
        composer: {
            title: composer,
            objectType: OBJECT_TYPE_CONTAINER,
            searchable: true,
            upnpclass: UPNP_CLASS_CONTAINER_MUSIC_COMPOSER,
            metaData: [],
            res: containerResource,
            aux: obj.aux,
            refID: containerRefID },
    };
    const isAudioBook = obj.upnpclass === UPNP_CLASS_AUDIO_BOOK;
    chain.album.metaData[M_ARTIST] = [ aartist ];
    chain.album.metaData[M_ALBUMARTIST] = [ aartist ];
    chain.album.metaData[M_GENRE] = [ genre ];
    chain.album.metaData[M_DATE] = obj.metaData[M_DATE];
    chain.album.metaData[M_UPNP_DATE] = obj.metaData[M_UPNP_DATE];
    chain.album.metaData[M_ALBUM] = [ album ];
    chain.artist.metaData[M_ARTIST] = [ aartist ];
    chain.artist.metaData[M_ALBUMARTIST] = [ aartist ];
    chain.all000.metaData[M_ARTIST] = [ aartist ];
    chain.all000.metaData[M_ALBUMARTIST] = [ aartist ];
    chain.year.metaData[M_DATE] = [ date ];
    chain.year.metaData[M_UPNP_DATE] = [ date ];
    chain.composer.metaData[M_COMPOSER] = [ composer ];
    const result = [];

    var container;
    if (isAudioBook) {
        chain.audio = {
            id: boxSetup[BK_audioInitialAudioBookRoot].id,
            title: boxSetup[BK_audioInitialAudioBookRoot].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioInitialAudioBookRoot].class };
        chain.allAlbums = {
            id: boxSetup[BK_audioInitialAllBooks].id,
            title: boxSetup[BK_audioInitialAllBooks].title,
            objectType: OBJECT_TYPE_CONTAINER,
            upnpclass: boxSetup[BK_audioInitialAllBooks].class };
    } else {
        container = addContainerTree([chain.audio, chain.allAudio]);
        result.push(addCdsObject(obj, container));
        container = addContainerTree([chain.audio, chain.allArtists, chain.artist, chain.allSongs]);
        result.push(addCdsObject(obj, container));
    }

    var temp = '';
    if (artist_full) {
        temp = artist_full;
    }

    if (album_full) {
        temp = temp + ' - ' + album_full + ' - ';
    } else {
        temp = temp + ' - ';
    }

    if (!isAudioBook) {
        obj.title = temp + title;
        if (boxSetup[BK_audioAllTracks].enabled) {
            container = addContainerTree([chain.audio, chain.allFull]);
            result.push(addCdsObject(obj, container));
            container = addContainerTree([chain.audio, chain.allArtists, chain.artist, chain.allFullArtist]);
            result.push(addCdsObject(obj, container));
        }
    }
    obj.title = track + title;
    container = addContainerTree([chain.audio, chain.allArtists, chain.artist, chain.album]);
    result.push(addCdsObject(obj, container));

    if (boxSetup[BK_audioAllAlbums].enabled) {
        if (!isAudioBook) {
            obj.title = album + " - " + track + title;
            container = addContainerTree([chain.audio, chain.allAlbums, chain.artist, chain.all000]);
            result.push(addCdsObject(obj, container));
        }
        obj.title = track + title;
        container = addContainerTree([chain.audio, chain.allAlbums, chain.artist, chain.album]);
        result.push(addCdsObject(obj, container));

        obj.title = track + title;
        // Remember, the server will sort all items by ID3 track if the
        // container class is set to UPNP_CLASS_CONTAINER_MUSIC_ALBUM.
        chain.all000.metaData[M_ARTIST] = [];
        chain.all000.metaData[M_ALBUMARTIST] = [];

        if (!isAudioBook) {
            chain.album.location = getRootPath(rootPath, obj.location).join('_');
            container = addContainerTree([chain.audio, chain.allAlbums, chain.all000, chain.album]);
            chain.album.location = '';
            result.push(addCdsObject(obj, container));
        }
    }

    var init = mapInitial(aartist.charAt(0));
    if (disknr != '') {
        var re = new RegExp('Children', 'i');
        var match = re.exec(genre);
        if (match) {
            if (disknr.length == 1) {
                chain.album.title = '0' + disknr + ' - ' + album;
            } else {
                chain.album.title = disknr + ' - ' + album;
            }
        }
    }
    if (init && init !== '') {
        chain.init.title = init;
    }

    var noAll = ['Audio Book', 'H.*rspiel', 'Stories', 'Gesprochen', 'Comedy'];
    var spokenMatch = false;
    for (var k=0; k < noAll.length; k++) {
        var re = new RegExp(noAll[k], 'i');
        var match = re.exec(genre);
        if (match) {
            spokenMatch = true;
        }
    }
    obj.title = track + title;
    chain.artist.searchable = true;
    chain.album.searchable = true;

    if (!isAudioBook) {
        container = addContainerTree([chain.audio, chain.abc, chain.init, chain.artist, chain.album]);
        result.push(addCdsObject(obj, container));
    }
    chain.artist.searchable = false;
    chain.album.searchable = false;

    if (spokenMatch === false && !isAudioBook) {
        var part = '';
        if (obj.metaData[M_UPNP_DATE] && obj.metaData[M_UPNP_DATE][0])
            part = obj.metaData[M_UPNP_DATE][0] + ' - ';
        obj.title = part + chain.album.title + " - " + track + title;
        container = addContainerTree([chain.audio, chain.abc, chain.init, chain.artist, chain.all000]);
        result.push(addCdsObject(obj, container));
    }
    chain.album.title = album;

    if (boxSetup[BK_audioAllGenres].enabled) {
        const genreConfig = config['/import/scripting/virtual-layout/genre-map/genre'];
        const genreNames = (genreConfig) ? Object.getOwnPropertyNames(genreConfig) : [];

        var gMatch = 0;
        for (var idx = 0; idx < genreNames.length; idx++) {
            var re = new RegExp('(' + genreNames[idx] + ')', 'i');
            var match = re.exec(genre);
            if (match) {
                obj.title = temp + track + title;
                gMatch = 1;
                chain.genre.title = genreConfig[genreNames[idx]];
                chain.all000.upnpclass = UPNP_CLASS_CONTAINER_MUSIC_GENRE;
                chain.all000.metaData[M_GENRE] = [ genreConfig[genreNames[idx]] ];
                chain.genre.metaData[M_GENRE] = [ genreConfig[genreNames[idx]] ];

                if (!isAudioBook) {
                    container = addContainerTree([chain.audio, chain.allGenres, chain.genre, chain.all000]);
                    result.push(addCdsObject(obj, container));
                }
                if (chain.genre.title === 'Children\'s') {
                    if (disknr.length === 1) {
                        chain.album.title = '0' + disknr + ' - ' + album;
                    } else {
                        chain.album.title = disknr + ' - ' + album;
                    }
                }
                container = addContainerTree([chain.audio, chain.allGenres, chain.genre, chain.artist, chain.album]);
                result.push(addCdsObject(obj, container));
            }
        }
        obj.title = temp + title;
        if (gMatch === 0) {
            chain.genre.title = 'Other';
            chain.genre.metaData[M_GENRE] = [ 'Other' ];
            container = addContainerTree([chain.audio, chain.allGenres, chain.genre]);
            result.push(addCdsObject(obj, container));
        }

        chain.genre.title = genre;
        chain.genre.metaData[M_GENRE] = [ genre ];
        chain.all000.upnpclass = UPNP_CLASS_CONTAINER;
        chain.all000.metaData[M_GENRE] = [];
        chain.genre.searchable = true;

        if (!isAudioBook) {
            container = addContainerTree([chain.audio, chain.allGenres, chain.all000, chain.genre]);
            result.push(addCdsObject(obj, container));
        }
    }

    if (boxSetup[BK_audioAllYears].enabled) {
        container = addContainerTree([chain.audio, chain.allYears, chain.year]);
        result.push(addCdsObject(obj, container));
    }

    if (boxSetup[BK_audioAllComposers].enabled) {
        container = addContainerTree([chain.audio, chain.allComposers, chain.composer]);
        result.push(addCdsObject(obj, container));
    }

    if (boxSetup[BK_audioArtistChronology].enabled && boxSetup[BK_audioAllArtists].enabled) {
        chain.album.searchable = false;
        chain.artist.searchable = false;
        chain.album.title = date + " - " + album;
        container = addContainerTree([chain.audio, chain.allArtists, chain.artist, chain.artistChronology, chain.album]);
        result.push(addCdsObject(obj, container));

        chain.album.title = album; // Restore the title;
    }
    return result;
}
