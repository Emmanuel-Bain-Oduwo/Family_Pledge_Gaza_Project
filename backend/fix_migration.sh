#!/bin/bash
sed -i 's/from .settings import AppSettings  # noqa: F401/from .settings import AppSettings  # noqa: F401\nfrom .password_reset import PasswordResetToken  # noqa: F401/g' app/models/__init__.py

sed -i 's/"AppSettings",/"AppSettings",\n    "PasswordResetToken",/g' app/models/__init__.py
