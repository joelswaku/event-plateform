exports.up = (pgm) => {
  pgm.addColumns('users', {
    verification_code: {
      type: 'varchar(6)',
      comment: '6-digit email verification code',
    },
    verification_code_expires: {
      type: 'timestamptz',
      comment: 'Expiration time for verification code',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['verification_code', 'verification_code_expires']);
};
