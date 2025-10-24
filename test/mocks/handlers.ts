import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/services', ({ request }) => {
    const url = new URL(request.url)
    const unitId = url.searchParams.get('unitId')
    if (!unitId) {
      return HttpResponse.json({ services: [] })
    }
    return HttpResponse.json({
      services: [
        {
          id: 'svc1',
          service_date: '2025-01-01',
          service_type: 'full_service',
          status: 'completed',
          technician: [{ first_name: 'Alex', last_name: 'Tech' }],
          water_tests: [{ all_parameters_ok: true, ph: 7.4, chlorine: 2.0 }],
        },
      ],
    })
  }),
]
