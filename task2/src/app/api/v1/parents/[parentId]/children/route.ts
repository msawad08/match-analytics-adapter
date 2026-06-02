import { NextResponse } from 'next/server'

const FIXTURE = {
  data: [
    {
      child_id: '2c2dbffd-cebb-42c0-8f28-fa6c8425abae',
      first_name: 'Kiyan',
      last_name: 'Makkawi',
      academy_id: '33d44f38-20ff-41c6-beb6-24c6dbb902dd',
      team: { team_id: '452b353e-8918-4103-b8e8-9be00c635fce', team_name: 'Under 12s' },
      jersey_number: 7,
      primary_position: 'MID',
    },
  ],
  pagination: { page: 1, page_size: 10, total: 1 },
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ parentId: string }> },
) {
  const { parentId } = await context.params

  if (!process.env.V1_API_BASE_URL) {
    return NextResponse.json(FIXTURE)
  }

  const res = await fetch(
    `${process.env.V1_API_BASE_URL}/api/v1/parents/${parentId}/children`,
    { headers: { Authorization: `Bearer ${process.env.FAIRPLAI_TOKEN ?? ''}` } },
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
