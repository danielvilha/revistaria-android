function getRemoteFile(filename, url, fileObj) {
	fileObj = {
		file : filename,
		url : url,
		path : null
	};

	var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, filename);
	if (file.exists()) {
		fileObj.path = Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator;
	} else {

		if (Titanium.Network.online) {
			var c = Titanium.Network.createHTTPClient();

			c.setTimeout(10000);
			c.onload = function() {

				if (c.status == 200) {

					var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, filename);
					f.write(this.responseData);
					fileObj.path = Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator;
				} else {
					fileObj.error = 'Arquivo não encontrado.';
					// to set some errors codes
				}
			};
			c.error = function(e) {
				fileObj.error = e.error;
			};

			c.open('GET', url);
			c.send();
		} else {
			fileObj.error = 'Sem conexão com a Internet.';
		}
	}
};
//--------------------------------------------------------------------------------------------------------------
//--------------------------end of file read--------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

function loadFile() {
	if (!Ti.Network.online)
		return;

	var xhr = Titanium.Network.createHTTPClient();

	xhr.onload = function() {
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);

		if (! dir.exists()) {
			dir.createDirectory();
		}

		var f = Ti.Filesystem.getFile(dir.resolve(), "revistaData.txt");
		f.write(this.responseData);

		abrirBt.visible = true;
		deldBt.visible = true;
		pb.visible = false;

		var db = Ti.Database.open('revistaDB');

		db.execute("UPDATE revista SET downloaded='1' WHERE editionId='" + data.editionId + "'");

		db.close();

		dir = null;
		f = null;
	};

	xhr.ondatastream = function(e) {
		pb.value = e.progress * 100;
	}

	xhr.open('GET', data.source);
	xhr.send();
}

//--------------------------------------------------------------------------------------------------------------
//--------------------------end of file read--------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

function getReadFile() {
	var xhr = Titanium.Network.createHTTPClient();
	var file = "revistaData.txt";
	xhr.open("GET", "http://www.megamidia.com.br/teste/revistaData.txt");
	xhr.onload = function() {
		// check status of connection to server
		statusCode = xhr.status;
		//check the response code returned
		if (statusCode == 200) {
			var doc = this.responseText;
			//write data from downloaded text file to local text file
			var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, file);
			f.write(doc);
		}
	};
	xhr.send();
	//-----------------------------------------------------------------------
	//---------------------local file read---------------------------------------
	var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, file);

	// read the file into contents var
	Ti.API.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + f.read());
};
//--------------------------------------------------------------------------------------------------------------
//--------------------------end of file read--------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------