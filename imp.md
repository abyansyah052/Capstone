karena sofar masi front end tolong buat backednya semua sebelumnya kamu akan kuberikan context sebgai oracle mu. 

untuk role ada 3 ya satu psikolog, staff, reguler perbedaan akses disini adalah hanya pada : yang bisa akses database psikolog hanyalah api staff dan untuk menghapus pasien dan mengedit hanyalah staff. untuk piskolog hanya diperbolehkan menambah pasien jadi dia juga tidak bisa lihat ada page database pasien. dan reguler dia hanya bisa membuka pafe dashboard, appoinment, laporan (tapi gabisa edit laporan).
pastikan disini abhwa daftar modul/page yang muncuk di dashboard sesuai dengan navbarnya dan navbar dan button moduk di dashboard sesuai dengan authority yang diberikan sesuai rolenya. oiya untuk staff dia ga bisa membuat laporan ya, yang bia hanya psikolog.


maka dari itu agar staff bisa menaikkan role reguler menjadi psikolog aku mau di page database psikolog disana juga ada panel yang menunjukkan dafatar user yang sudah pernah login agar bisa dinaikkan rolenya psikolog. nah panel tersebut ada di button tambah psikolog baru jadi nanti setelah mengklik button tersebut akan muncul pilihan untuk tambah data psikolog baru dengan memilih user yang sudah pernah login jadi nanti emailnya langsung terisi dari sana. hal ini diperlukan karena psikolog yang membuat laporan kan data nama dan no.sipp nya langsung generated di laporan.

intinya disini tiap page memiliki hubungan kamu harus asses itu. oke selanjutnya adalah setelah psikolog berhasil dinaikkan role aku mau ada notifikasi bagi psikolog untuk memasukkan ttd mereka terlebih dahulu bisa upload ttd file atau online sign terlebih dahulu sebagai kelengkapan data mereka. jadi nanti bakal ada popup untuk melakukan hal itu. pastikan semua design FE sesuai ya dengan gsm Asisya.

oke selanjutnya adalah di janji temu disitu kan ada notifikasi ke email dan nomor itu rencananya nanti aku kamu ngirim API langsung yang bisa ngirim ke nomor mereka dan ke email mereka untuk mengirimkan pemberitahuan pertemuan dan file calender ke email. tapi itu nanti aja kan harus siapkan credentialnya dulu. yang aku mau kamu siapkan env nya aja dulu.

yang terakhir baru kamu kerjakan auth pastikan bisa login dengan google dan bisa logout juga

bikin lah task dan lakukan satu" secara efisien. untuk DB di localku aku punya psql pakai itu dulu ya.