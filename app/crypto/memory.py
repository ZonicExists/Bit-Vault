def zero_buffer(buf: bytearray | memoryview) -> None:
    """
    Securely overwrite volatile memory buffers with zeros.
    """
    if isinstance(buf, (bytearray, memoryview)):
        for i in range(len(buf)):
            buf[i] = 0
