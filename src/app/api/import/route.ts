import { NextRequest, NextResponse } from 'next/server'
import { importCsv } from '@/lib/csv-import'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let csvText = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
      }
      csvText = await (file as File).text()
    } else {
      csvText = await request.text()
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: 'Empty CSV content' }, { status: 400 })
    }

    const result = await importCsv(csvText)
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 })
  }
}
