aW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlUmVmIH0gZnJvbSAicmVhY3QiCmltcG9ydCB7CiAgQ2FtZXJhLCBDaGVja0NpcmNsZTIsIENhbGVuZGFyIGFzIENhbGVuZGFySWNvbiwKICBDaGV2cm9uRG93biwgUGx1cywgU2VhcmNoLCBGaWx0ZXIsCiAgQXJyb3dMZWZ0LCBCdWlsZGluZzIsIFgsIFBlbmNpbCwgVHJhc2gyLCBMb2NrLAogIEFsZXJ0Q2lyY2xlLAp9IGZyb20gImx1Y2lkZS1yZWFjdCIKaW1wb3J0IHsgbW90aW9uLCBBbmltYXRlUHJlc2VuY2UgfSBmcm9tICJtb3Rpb24vcmVhY3QiCgovLyDilJQgVHlwZXMg4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU4pSU

type Batch = { id: string; name: string; company: string; color: string }

export type Patient = {
  id: string
  name: string
  email: string
  idNumber: string
  age: number
  gender: string   // "M" | "F" | "O"
  phone: string
  registeredAt: string
  hasPhoto: boolean
  initials: string
  batchId: string  // "" = no batch
  // ── Field tambahan ──
  birthPlace: string
  education: string
  siblingOrder: string
  totalSiblings: string
}