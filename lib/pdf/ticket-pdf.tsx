import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { RegistrationDetail } from '@/lib/db/queries/registrations'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 32,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#6DC230',
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3A7D0A',
  },
  tagline: {
    fontSize: 9,
    color: '#5A6B4E',
    marginTop: 2,
  },
  org: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3A7D0A',
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#F5F7F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regLabel: {
    fontSize: 9,
    color: '#5A6B4E',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  regNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2714',
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: '#2ECC71',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#5A6B4E',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A2714',
  },
  bibSection: {
    backgroundColor: '#FAFCF8',
    borderWidth: 1,
    borderColor: '#E8EDE3',
    borderRadius: 6,
    padding: 8,
    marginVertical: 8,
  },
  bibTitle: {
    fontSize: 8,
    color: '#3A7D0A',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bibList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bibItem: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A2714',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6DC230',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDE3',
    marginVertical: 8,
  },
  impactBox: {
    backgroundColor: '#FFF8E7',
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
    padding: 8,
    borderRadius: 4,
    marginVertical: 6,
  },
  impactText: {
    fontSize: 9,
    color: '#8A5800',
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 7.5,
    color: '#5A6B4E',
    textAlign: 'center',
    marginTop: 10,
  },
})

export function TicketPDF({ registration }: { registration: RegistrationDetail }) {
  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Walk Impact 2026</Text>
            <Text style={styles.tagline}>Walk Together and Create Impact</Text>
          </View>
          <View>
            <Text style={styles.org}>LAZ DARUL HIKAM</Text>
            <Text style={{ fontSize: 8, color: '#5A6B4E', textAlign: 'right' }}>Official E-Ticket</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={styles.regLabel}>Nomor Pendaftaran</Text>
            <Text style={styles.regNumber}>{registration.registration_number}</Text>
          </View>
          <Text style={styles.statusBadge}>{registration.status || 'PAID'}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Nama Pendaftar</Text>
            <Text style={styles.value}>{registration.contact_name}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Nomor WhatsApp</Text>
            <Text style={styles.value}>{registration.contact_whatsapp}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Kategori Peserta</Text>
            <Text style={styles.value}>{registration.category_label || 'Umum'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Waktu & Tanggal</Text>
            <Text style={styles.value}>Sabtu, 7 November 2026 · 05.30 WIB</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Lokasi Acara</Text>
            <Text style={styles.value}>Pasar Modern Batununggal Indah, Bandung</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Jumlah Tiket</Text>
            <Text style={styles.value}>{registration.ticket_qty} Tiket</Text>
          </View>
        </View>

        {/* Participant & BIB Numbers */}
        {registration.participants && registration.participants.length > 0 && (
          <View style={styles.bibSection}>
            <Text style={styles.bibTitle}>Daftar Peserta & Nomor BIB</Text>
            <View style={styles.bibList}>
              {registration.participants.map((p) => (
                <Text key={p.slot} style={styles.bibItem}>
                  Slot {p.slot}: {p.name || 'Peserta'} {p.bib_number ? `· BIB #${p.bib_number}` : ''} (Kaos: {p.size_code})
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.impactBox}>
          <Text style={styles.impactText}>
            ★ 1 Tiketmu = 1 Paket Sembako untuk Masyarakat Pra-sejahtera Bandung
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.footer}>
          Tunjukkan tiket ini saat pengambilan perlengkapan (2–3 Nov 2026) dan registrasi ulang Hari-H · Kontak: +62 815-7222-5545 · walkimpact.id
        </Text>
      </Page>
    </Document>
  )
}
