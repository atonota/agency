import json
# (etiket, tür) — ham liste, tekrarlar dahil. Sıra korunur; çıktı kaynağa göre gruplanmaz.
H,L,S,R,C,M,A,D="baslik","baglanti","sosyal","rozet","cta","marka","uygulama_magazasi","dil"
raw=[]
def add(t,*labels):
    for l in labels: raw.append((l,t))
# Codeberg
add(H,"Codeberg","Association","Services","Legal")
add(L,"Blog","Documentation","Community issues","Contributing","Report abuse","Who are we?","Bylaws / Satzung","Donate","Join / Support","Contact","Codeberg Pages","Codeberg Translate","Woodpecker CI","Forgejo API","Status page","Imprint / Impressum","Privacy Policy","Licenses","Terms of Use")
add(S,"Mastodon","Matrix Space (Web link)")
add(M,"Powered by Forgejo")
# Sabancı
add(H,"Hakkında","Sürdürülebilirlik","İş Grupları","Teknoloji & İnovasyon","Yatırımcı İlişkileri","Medya","Sabancı'da Yaşam ve Kariyer","İletişim")
add(L,"Sabancı Holding","Yönetim","Tarihte Sabancı","Unutamadıklarımız","Sosyal Projeler","Sosyo-Kültürel","Faaliyet Raporu","Politikalar","Kişisel Verilerin Korunması",
 "Sürdürülebilirlikte Öncü Olmak","Sürdürülebilirlik Yaklaşımımız","Sürdürülebilirlik Hedeflerimiz","Sürdürülebilirlik Raporu",
 "Banka ve Finansal Hizmetler","Enerji ve İklim Teknolojileri","Malzeme Teknolojileri","Dijital","Mobilite Çözümleri","Perakende","Diğer Sektörler",
 "Enerji ve İklim Teknolojileri","Malzeme Teknolojileri","Dijital Teknolojiler","AR-GE Merkezleri","Girişim Ekosistemi",
 "Kullanım Koşulları","Gizlilik","Bilgi Toplumu Hizmetleri","Kişisel Verilerin Korunması Kanunu","Sabancı Holding E-Bülten Aydınlatma Metni","Sabancı Vakfı","Sabancı Üni.","SSM")
add(S,"LinkedIn","Instagram","YouTube","X","Facebook")
# Arçelik
add(H,"Ürünler","Kurumsal","Destek","Hizmet","Daha Fazlası","Özel Günler & Kampanyalar")
add(L,"Beyaz Eşya","Ankastre","Elektronik","Isıtma Soğutma","Küçük Ev Aletleri","Yedek Parça Ve Aksesuar","Su Sebili & Su Arıtma","Evcil Hayvan Ürünleri",
 "Arçelik A.Ş.","Kurumsal Çözümler","İnsan Kaynakları","Kişisel Verilerin Korunması","Medya İlişkileri","Kurumsal","Müşteri Memnuniyeti","Hizmet Talebinin Değerlendirilmesi","Sürdürülebilirlik","Yatırımcı İlişkileri",
 "Yazılım ve Kılavuz Arama","TV Yazılım İndirme Merkezi","Katalog ve Broşür","Garanti Uygulamaları","Satın Alma Rehberi","Sıkça Sorulan Sorular","E-Ticaret Destek","Destek","Online Uzman","Destek Kaydı","Garanti Süresini Uzat","Sipariş Takip","Site Haritası",
 "Yetkili Satıcı Başvuru Formu","Arçelik Mağazalar","Konsept Mağazalar","Yetkili Servis Başvuru Formu","Yetkili Servisler",
 "Blog","İklim Dostu Hareket","Mucize Lezzetler","Mucize Lezzetler TV Uygulaması","Oyun Merkezi","Teknolojiler","Babalar Günü","Okula Dönüş",
 "Bize Ulaşın","Kişisel Verilerin Korunması","İşlem Rehberi","Satış Sözleşmesi","Gizlilik Politikası","Hizmet Şartları")
add(S,"Facebook","Instagram","X","YouTube")
add(C,"7/24 Çağrı Destek Merkezi","Teknik Destek ve Servis Randevusu")
add(R,"eyebrand – Blind Friendly Brand","ETBİS'e Kayıtlıdır","Customer Oriented Company (görselde bulanık)","TR GO","SGS ISO 10002")
# Rozet yakın çekim görseli (aynı rozetler)
add(R,"eyebrand – Blind Friendly Brand","ETBİS'e Kayıtlıdır","Customer Oriented Company (görselde bulanık)","TR GO","SGS ISO 10002")
# Beko
add(H,"Ürünler","Kurumsal","Destek","Hizmet","Daha Fazlası","Özel Günler & Kampanyalar")
add(L,"Beyaz Eşya","Ankastre","Elektronik","Isıtma Soğutma ve Enerji","Küçük Ev Aletleri","Yedek Parça Ve Aksesuar","Su Sebili & Su Arıtma",
 "Kurucumuz","Tarihçe","Yanındayız","Kişisel Verilerin Korunması","Kurumsal","Hizmet Talebinin Değerlendirilmesi",
 "Servis Randevusu","Yazılım ve Kılavuz Arama","TV Yazılım İndirme Merkezi","Katalog ve Broşür","Destek Kaydı","Garanti Uygulamaları","Satın Alma Rehberi","E-Ticaret Destek","Destek","Sıkça Sorulan Sorular","Garanti Süresini Uzat",
 "Beko Mağazalar","Yetkili Servisler","Yetkili Servis Başvuru Formu","Yetkili Satıcı Başvuru Formu","Blog","Oyunlar Dünyası","Teknolojiler","Okula Dönüş")
add(S,"Facebook","Instagram","X","YouTube")
add(C,"7/24 Çağrı Destek Merkezi","Teknik Destek ve Servis Randevusu")
add(R,"Beko No.1")
# Migros
add(H,"Kurumsal","Gizlilik ve Politikalar","Yardım","Mobil Uygulamalar","Sosyal Medya Hesaplarımız")
add(L,"Hakkımızda","Yatırımcı İlişkileri","Sürdürülebilirlik","Medya","Kariyer",
 "Kişisel Verilerin Korunması ve İşlenmesi Politikası","Kişisel Verilerin Korunması - Başvuru Formu","Çerez Politikası Aydınlatma Metni","Veri Güvenliği Tedbirleri","Bilgi Toplumu Hizmetleri","Bilgi Güvenliği Politikası",
 "Bize Ulaşın","Sıkça Sorulan Sorular","Dilek, İstek ve Şikayet","Kiralık Yeriniz mi Var?")
add(A,"App Store","Google Play","AppGallery")
add(S,"Facebook","X","Instagram","YouTube","LinkedIn")
add(M,"Anadolu Grubu")
# Anadolu grup şirketleri şeridi
add(H,"Grup Şirketlerimiz ve Sosyal Kuruluşlarımız")
add(M,"Migros","CCI","Anadolu Efes","Anadolu Isuzu","Çelik Motor","Garenta","Anadolu Motor")
# Carrefour
add(H,"Bizi takip edin","Grup","Finans","Kurumsal Sosyal Sorumluluk","Haber Odası","İK")
add(S,"Twitter","LinkedIn")
add(L,"Carrefour Faaliyetleri","Mağazalar","Carrefour Yönetimi","Vakıf ve Dayanışma","Carrefour Hikayesi","Carrefour 2030 Stratejisi","Gıda Geçişi","Carrefour Franchise","Paris 2024 Olimpiyat ve Paralimpik Oyunları","Beni Besle",
 "Hissedar bölümü","Hissedarlar Toplantısı","Carrefour Hissesi","Finansal yayınlar","Düzenlenmiş bilgiler","Evrensel Kayıt Belgesi","Borç ve Derecelendirme",
 "Kurumsal Sosyal Sorumluluk Yönetişimi","Performans","Bağlılık","Kurumsal Sosyal Sorumluluk Kütüphanesi","Kurumsal Sosyal Sorumluluk haberleri","Orman Şeffaflık Platformu","Tekrar başlat","Tedarikçi",
 "Tüm haberler","Değişim İçin Harekete Geçin","Çeşitlilik","Carrefour'da kişisel veri koruması",
 "Genel terimler","Çerez politikası","Çerezleri yapılandırın","Gizlilik politikası","Faciliti","Erişilebilirlik: Kısmen uyumlu","Yasal bildirimler")
# Garanti BBVA kurumsal yönetim menüsü
add(H,"Kurumsal yönetim")
add(L,"Kurumsal yönetim uyum beyanı","Organizasyon yapısı","Yönetim kurulu","Yönetim Kurulu Çalışma Esasları Yönetmeliği","Yönetim kurulu matrisi","Yönetim kurulu komiteleri","Üst yönetim","Yönetim kurulu danışmanı","Uluslararası danışma kurulu","Etik ilkeler","Sermaye ve ticaret sicil bilgileri","Bağımsız Denetim","Politikalar","FATCA/CRS","Uyum","Uyum başkanı","Ana sözleşme","Genel kurul dokümanları","Dijital güven ilkeleri","SPK İnternet sitesi yükümlülükleri","İzahname ve sirküler")
# Yapı Kredi IR
add(H,"Yapı Kredi Hakkında","Sürdürülebilirlik","Finansal Bilgiler & Duyurular","Hisse Bilgileri","Borçlanma Aracı İhraçları","Duyurular","Kurumsal Yönetim")
add(L,"Genel Bakış","Tarihçe","Kurumsal Profil","Kredi Notları","Vizyon, Misyon, Strateji ve Değerler","Ortaklık Yapısı","Yönetim Kurulu","Üst Yönetim","Bankacılık Faaliyetleri","Yapı Kredi İştirakleri","Ödüller",
 "Genel Bakış","Sürdürülebilirlik Yönetimi","Yönetişim Yapısı","Politikalar","Strateji","Sürdürülebilirlik Yolculuğu","Kilometre Taşları","Üyelikler ve İnisiyatifler","Ödüller","Sürdürülebilir Finansman","Sürdürülebilir Borçlanma","Sorumlu Ürün ve Hizmetler","Çevresel ve Sosyal Risk Yönetimi","Finansal Sağlık ve Kapsayıcılık","Sürdürülebilirlik Raporları","Endeksler ve Ratingler","Çevre ve Toplum","Net Sıfır Yaklaşımı","Sorumlu Kaynak Yönetimi","Cinsiyet Eşitliği ve Çeşitliliği","Engelsiz Bankacılık","Toplumsal Katkı","Kültür Sanat","Sürdürülebilir Tercih Programı (Step)","Sürdürülebilirliği Anlatıyoruz","Basın Bültenleri","Sürdürülebilirlik Gündemi","WISER","Sürdürülebilirlik Sohbetleri","Sürdürülebilirliği Konuşalım","Dünya Kadar Sade",
 "Genel Bakış","Sunumlar","Finansal Sonuçlara İlişkin Sunumlar","Yatırımcı Sunumları","Öncelikler ve Beklenti Sunumları","Raporlar","Faaliyet Raporları","Sürdürülebilirlik Raporları","BDDK Konsolide Finansal Raporlar","TFRS Finansal Tablolar","BDDK Konsolide Olmayan Finansal Raporlar","İlk Bakışta Yapı Kredi","Duyurular","Duyurular","Kamuyu Aydınlatma","Yatırımcı Takvimi","Toplantı Ses Kayıtları","Çeyreksel Etkinlikler & Web-Cast Ses Kaydı",
 "Genel Bakış","Hisse Bilgileri","Yatırımcı Araçları","Hisse Fiyat Grafiği","Yatırımcı Kiti","Yatırımcı Hesap Makinesi","Neden Yapı Kredi'ye Yatırım Yapmalıyım?","Neden Türkiye?","Neden Türk Bankacılık Sistemi?","Neden Yapı Kredi?","Temettüler","Sermaye Artırımları","Analistler",
 "Genel Bakış","Borçlanma Aracı İhraçları","MTN Programı","Sürdürülebilir Tahviller","Sermaye Benzeri Tahvil","İpotek Teminatlı Menkul Kıymet",
 "Duyurular","Kamuyu Aydınlatma","Yatırımcı Takvimi",
 "Genel Bakış","Kurumsal Yönetim Uyum Raporu","Kurumsal Yönetim İlkelerine Uyum Beyanı","Kurumsal Yönetim İlkelerine Uyum Raporları","Kurumsal Yönetim Bilgi Formu","Kurumsal Yönetim Derecelendirme Raporu","Yönetim Kurulu","Üst Yönetim","Komiteler","Etik İlkeler ve Politikalar","AML Politikası","Genel Kurul Toplantıları","Esas sözleşme",
 "Ana sayfa","Gizlilik","İletişim")
add(M,"Site by LuckyEye")
# Yapı Kredi yan menü
add(L,"Haberler","Basın Bültenleri","Yapı Kredi Blog","Yapı Kredi Podcast Kanalları","Etkinlikler ve Sponsorluklar","Yapı Kredi Akademi","Değerlerimiz","İnsan Kaynakları","Sürdürülebilirlik","Kurumsal Sosyal Sorumluluk","Kültür ve Sanat","İştirakler","Piyasa Bültenleri","Reklamlarımız","Satılık Gayrimenkuller","İletişim","Bağımsız Güvence Raporu")
# Yapı Kredi footer
add(H,"Duyurular","Bize Ulaşın","İlginizi Çekebilir","Yatırım & Finans","Kartlar & Başvurular","Krediler","Faydalı Sayfalar","Bizi Takip Edin")
add(L,"Tüm Duyurular","Memnuniyetiniz İçin","İletişim",
 "Emekli Promosyon","Uygulama Marketi","Vadesiz Mevduat","Vadeli Mevduat","Yapı Kredi Hakkında","Sürdürülebilirlik","Haberler","Basın Bültenleri","İnsan Kaynakları","EYT",
 "Canlı Döviz","Yatırım Fonları","Altın Mevduat","Altın","Halka Arz","Hisse Senedi","Vadeli Mevduat Oranları","Yurt Dışı Piyasaları","Yatırımcı Köşesi","Dolar Kaç TL",
 "Banka Hesabı Aç","Ticari Hesap Aç","Kredi Kartı Başvuru","Banka Kartı","Kredi Kartı","Worldcard","Ticari Kartlar","Kredi Kartı Asgari Hesaplama","Güvenli Araç Alım Satım","Kiram Hesabımda",
 "Konut Kredisi","İhtiyaç Kredisi","Kredi","Taşıt Kredisi","Kredi Başvurusu","3 Ay Ertelemeli Kredi","Esnek Hesap/Kredili Mevduat Hesabı","EYT Kredisi","Alışveriş Kredisi","2. El Araç Kredisi",
 "Yatırımcı İlişkileri","Kredi Hesaplama","Döviz Hesaplama","Mevduat Hesaplama","Fatura Ödeme","HGS","MTV Ödeme","Trafik Sigortası","Kasko","Sıkça Sorulan Sorular","Site Haritası",
 "TMSF ve YTM Zaman Aşımı Listesi","Bilgi Toplumu Hizmetleri","Kişisel Verilerin Korunması","Gizlilik Politikası","Çerez Aydınlatma Metni")
add(S,"Facebook","X","Instagram","LinkedIn","YouTube")
add(M,"Blog","FRWRD","Koç 100")
# Yıldız Holding
add(L,"Sabri Ülker Vakfı","Gıda Güvenliği Kurulu","Site Haritası","İletişim","Kullanım Şartları","Bilgi Güvenliği Politikası","Bilgi Toplumu Hizmetleri","Kişisel Verilerin Korunması","Çerez Tercihleri")
# Anadolu Grubu
add(H,"Bizi Tanıyın","Grup Şirketleri","Yatırımcı İlişkileri","Sürdürülebilirlik","Anadolu Vakfı")
add(L,"Biz","Değerlerimiz","Onursal Başkanlarımız","Yönetim Kurulu Başkanı Mesajı","İcra Başkanı Mesajı","Yönetim","Operasyon Coğrafyamız","Tarihçemiz",
 "Perakende Grubu","Meşrubat Grubu","Bira Grubu","Otomotiv Grubu","Tarım, Enerji ve Sanayi Grubu","Sosyal Kuruluşlar",
 "Hissedarlar ve Yatırımcı İlişkileri","Kurumsal Yönetim","Strateji","Raporlar","Politika ve Prosedürler","Vakfımız","Faaliyetlerimiz",
 "Anadolu Grubu Kariyer","Anadolu'dan Haberler","İletişim","Yasal Uyarı","Çerez Ayarları","Kişisel Verilerin Korunması","Bilgi Toplumu Hizmetleri")
add(D,"EN","RU")
add(S,"LinkedIn","Instagram","X","Facebook","YouTube")
# Eczacıbaşı
add(H,"Bizi Takip Edin","İletişim")
add(S,"Instagram","Twitter","LinkedIn","YouTube","Facebook")
add(L,"İletişim Formu","Bilgi Toplumu Hizmetleri","Kişisel Verilerin Korunması","Çerez Aydınlatma Metni","Etik Kurallar","Çerez Tercihleri","Bilgi Güvenliği Politikası","Kullanım Koşulları")
# Zorlu
add(H,"Bizi Takip Edin","Kurumsal","Faaliyet Alanları","Mehmet Zorlu Vakfı","Sürdürülebilirlik","Kariyer","Medya Merkezi","Bize Ulaşın")
add(S,"Facebook","X","Instagram")
add(L,"Kurucumuz","Yönetim","Tarihçe","Sayılarla Zorlu","Finansal Bilgiler","Değerlerimiz","Toplumsal Yatırım Projeleri","Sürdürülebilirlik Raporları","Taahhütlerimiz",
 "Sektörler","Diğer Faaliyet Alanları","Markalar","Zorlu Dergi","Medya İletişim Merkezi","Bültenler",
 "İletişim","Zorlu Holding Tedarikçileri","Kişisel Verilerin Korunması","Bilgi Güvenliği Politikası",
 "Bize Ulaşın","Bilgi Topluluğu Hizmetleri","Gizlilik ve Kullanım Koşulları","Kişisel Verilerin Korunması","Çerezleri Yönet","Çerez Politikası")
# Doğuş site haritası
add(H,"Site Haritası","Anasayfa","Doğuş Grubu'nu Tanıyın","Yatırımcı İlişkileri","Sektörler","İnsan Kaynakları","Kurumsal Sorumluluk","Basın Odası","Biz'D Dergisi","İletişim")
add(L,"Kurucumuz","Hakkımızda","Yönetim Kurulu","Vizyonumuz","Operasyon Haritası",
 "Otomotiv","İnşaat","Doğuş Yayın Grubu","Doğuş Yeme-İçme, Turizm ve Perakende","Gayrimenkul","Enerji","Diğer Yatırımlar",
 "Değerlerimiz","Doğuş'lu Olmak","Aile İçi Şiddet İş Yeri İlkeleri Politikası","Doğuş'ta İş Fırsatları","İşe Alım","Eğitim ve Gelişim","Performans Yönetimi","Ücretlendirme Sistemi ve Yan Hakları","Sosyal Yaşam","İş'te Eşitlik Bildirgesi",
 "Doğuştan İyi Bir Gelecek","Neler Yapıyoruz","KSS Raporlarımız","KSS Video","Sanata Doğuştan İyi Bir Gelecek","Tarihe Doğuştan İyi Bir Gelecek","Çocuklara Doğuştan İyi Bir Gelecek","Gençlere Doğuştan İyi Bir Gelecek","Topluma Doğuştan İyi Bir Gelecek","Kadınlara Doğuştan İyi Bir Gelecek","Spora Doğuştan İyi Bir Gelecek",
 "Site Haritası","Bilgi Toplumu Hizmetleri","Kullanım Koşulları","Kişisel Verilerin Korunması","Çerez Aydınlatma Metni","Çerez Ayarları")
# Borusan
add(H,"Kurumsal","Grup Şirketleri","Sürdürülebilirlik","Toplumsal Fayda","Medya Merkezi","İletişim","Yatırımcı İlişkileri","Kariyer")
add(L,"Hakkımızda","Grup Vizyon Misyonumuz","Kilometre Taşlarımız","Değerlerimiz","İş Ortaklarımız ve Markalarımız","Kurumsal Yapımız","Turuncu Etik İlkemiz","Blog",
 "Borusan Grubu","Üretim","Makine ve Güç Sistemleri","Otomotiv","Liman Hizmetleri","Enerji","Kurumsal Girişim Sermayesi",
 "Sürdürülebilirlik Manifestomuz","Sürdürülebilirlik Yolculuğumuz","Sürdürülebilirlik Yaklaşımımız","Borusan'da Sürdürülebilirliğin Yönetimi","Sürdürülebilir Tedarik Zinciri","Geleceğe İlham Ödülleri","Raporlarımız",
 "Toplumsal Fayda Anlayışımız","Borusan Kocabıyık Vakfı","Borusan Sanat","Borusan Contemporary","Borusan Eşittir","Okyanus Gönüllü Borusanlılar Platformu","Borusan Sürdürülebilir Fayda Programı",
 "Çerez Politikası","Bilgi Güvenliği ve Yönetim Sistemi Politikası","Kişisel Verilerin Korunması","Kullanım Koşulları","Bilgi Toplumu Hizmetleri")
add(S,"Facebook","Instagram","X","LinkedIn","Vimeo","YouTube")

def key(s):
    s=s.strip().replace("İ","i").replace("I","ı")
    return " ".join(s.lower().split())
def is_caps(s): return s==s.upper() and s!=s.lower()
items={}
for lbl,t in raw:
    k=key(lbl)
    if k not in items:
        items[k]={"etiket":lbl,"turler":[t],"tekrar":1}
    else:
        it=items[k]; it["tekrar"]+=1
        if t not in it["turler"]: it["turler"].append(t)
        if is_caps(it["etiket"]) and not is_caps(lbl): it["etiket"]=lbl
out=[]
for i,it in enumerate(items.values(),1):
    out.append({"id":i,**it})
data={
 "aciklama":"Ekran görüntülerindeki tüm menü öğeleri. Kaynak/görsel bazlı gruplama yok. Yalnızca birebir aynı metinler (büyük/küçük harf farkı Türkçe kurallarla yok sayılarak) birleştirildi; benzer ama farklı metinler ayrı tutuldu.",
 "alanlar":{"etiket":"Görünen metin","turler":"baslik | baglanti | sosyal | rozet | cta | marka | uygulama_magazasi | dil","tekrar":"Tüm görsellerde toplam görülme sayısı"},
 "toplam_ham_kayit":len(raw),"toplam_benzersiz":len(out),
 "ogeler":out,
 "haric_tutulanlar":["Görev verisini hazırla (uygulama butonu, footer menüsü değil)","Vikipedi 'Türkiye'nin en zengin 100 ailesi' tablosu (menü değil)","Telif satırları (© ...)","Sitelerin kendi logoları","Adres ve telefon numaraları","Kesik 'Metni' öğesi (Yapı Kredi yan menü, tamamı görünmüyor)","Başa dön / reCAPTCHA ikonları"]
}
json.dump(data,open("menu-items.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
print(len(raw),len(out))
top=sorted(out,key=lambda x:-x["tekrar"])[:15]
for t in top: print(t["tekrar"],t["etiket"])
