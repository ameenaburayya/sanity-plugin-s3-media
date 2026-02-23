const {defineCreateClientExportsMock, createClientMock, MockS3Client} = vi.hoisted(() => {
  class TestS3Client {}

  return {
    defineCreateClientExportsMock: vi.fn(),
    createClientMock: vi.fn(),
    MockS3Client: TestS3Client,
  }
})

vi.mock('../defineCreateClient', () => {
  return {
    default: defineCreateClientExportsMock,
  }
})

vi.mock('../S3Client', () => {
  return {
    S3Client: MockS3Client,
  }
})

describe('S3Client index exports', () => {
  beforeEach(() => {
    vi.resetModules()
    defineCreateClientExportsMock.mockReset()
    createClientMock.mockReset()

    defineCreateClientExportsMock.mockReturnValue({
      createClient: createClientMock,
    })
  })

  it('wires createS3Client to defineCreateClientExports and re-exports S3Client', async () => {
    const mod = await import('../index')

    expect(defineCreateClientExportsMock).toHaveBeenCalledTimes(1)
    expect(defineCreateClientExportsMock).toHaveBeenCalledWith(MockS3Client)
    expect(mod.S3Client).toBe(MockS3Client)

    const config = {bucketKey: 'bucket'}
    mod.createS3Client(config as any)

    expect(createClientMock).toHaveBeenCalledWith(config)
  })
})
